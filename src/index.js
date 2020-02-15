import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import JsxParser from "react-jsx-parser";
import flatten, { unflatten } from "flat";
import { merge, get } from "lodash";
import escape from "js-string-escape";

const Context = React.createContext({});

const tabs = n => [...Array(n)].map(() => "  ").join("");

const prop = (name, value, components, idt) => {
  if (name.charAt(0).toUpperCase() === name.charAt(0)) {
    if (typeof value === "string") {
      const Component = components[value];
      if (Component) {
        return `${name}={${value}}`;
      }
    } else if (!!value && typeof value === "object") {
      return `${name}={\n${jsx(value, components, "", idt + 1)}\n${tabs(idt)}}`;
    }
    console.warn(`Propeteer: Unable to evaluate element prop ${name}.`);
  } else if (typeof value === "boolean" && value) {
    return name;
  } else if (typeof value === "boolean" && !value) {
    return `${name}={false}`;
  } else if (typeof value === "number" || value === null) {
    return `${name}={${value}}`;
  } else if (typeof value === "object") {
    return `${name}={${JSON.stringify(value)}}`;
  } else if (typeof value === "string") {
    return `${name}="${escape(value)}"`;
  }
  return "";
};

const props = (props = {}, components = {}, str, idt) =>
  Object.entries(props).reduce((s, [name, value]) => {
    const p = prop(name, value, components, idt);
    if (typeof p === "string" && p.length > 0) {
      return `${s}${tabs(idt)}${p}\n`;
    }
    return s;
  }, "");

const jsx = (def = {}, components = {}, str = "", idt = 0) => {
  const { _: Component, $: children, children: $, ...extraProps } = def;
  if (components.hasOwnProperty(Component)) {
    const hasChildren = Array.isArray(children);
    const hasProps = Object.keys(extraProps).length > 0;
    const defaultProps = Component.defaultProps || {};
    const ind = tabs(idt);
    const pfx = hasProps
      ? `${ind}<${Component}\n${props(
          merge(extraProps, defaultProps),
          components,
          "",
          idt + 1
        )}${ind}`
      : `<${Component}`;
    return `${pfx}${
      hasChildren
        ? `>\n${children
            .map(child => jsx(child, components, "", idt + 1))
            .join("\n")}\n${tabs(idt)}</${Component}>`
        : `/>`
    }`;
  }
  console.warn(
    `Propeteer: Unable to find definition of ${Component}. This will be ignored.`
  );
  return str;
};

const antialias = (flattened, aliases) =>
  Object.entries(flattened).reduce((obj, [key, value]) => {
    return {
      ...obj,
      [aliases[key] || key]: value
    };
  }, {});

const getJsxFor = (children, LookUpTable, aliases) => {
  const hasChildren = !!children && typeof children === "object";
  const hasLookUpTable = !!LookUpTable && typeof LookUpTable === "object";
  if (hasChildren && hasLookUpTable) {
    const { _: Root } = children;
    if (typeof Root === "string") {
      if (LookUpTable.Puppet) {
        console.warn(
          'Propeteer: You have attempted to use a reserved class name, "Puppet". This will be overridden.'
        );
      }
      const lookUpTable = {
        ...LookUpTable,
        Puppet: class Puppet extends React.Component {
          static contextType = Context;
          render() {
            const Component = LookUpTable[Root];
            return <Component {...this.props} {...this.context} />;
          }
        }
      };
      const components = flatten(lookUpTable);
      return [
        components,
        jsx(
          unflatten(
            antialias(
              flatten({
                ...children,
                _: "Puppet"
              }),
              flatten(aliases)
            )
          ),
          components
        )
      ];
    }
  }
  return [];
};

const Propeteer = ({ children, LookUpTable, aliases, ...extraProps }) => {
  const [[components, jsx], setJsx] = useState(
    getJsxFor(children, LookUpTable, aliases)
  );
  useEffect(() => {
    setJsx(getJsxFor(children, LookUpTable, aliases));
  }, [children, LookUpTable, aliases]);
  if (components && jsx) {
    return (
      <Context.Provider value={extraProps}>
        <JsxParser jsx={jsx} components={components} renderInWrapper={false} />
      </Context.Provider>
    );
  }
  return null;
};

Propeteer.propTypes = {
  LookUpTable: PropTypes.shape({}),
  children: PropTypes.shape({}),
  aliases: PropTypes.shape({})
};

Propeteer.defaultProps = {
  LookUpTable: null,
  children: null,
  aliases: {}
};

export default Propeteer;
