import React from 'react';
import PropTypes from 'prop-types';
import JsxParser from 'react-jsx-parser';
import flatten, { unflatten } from 'flat';
import { merge } from 'lodash';

const tabs = n => (
  [...Array(n)]
    .map(() => '  ')
    .join('')
);

const prop = (name, value, components, idt) => {
  if (name.charAt(0).toUpperCase() === name.charAt(0)) {
    if (typeof value === 'string') {
      const Component = components[value];
      if (Component) {
        return `${name}={${value}}`;
      }
    } else if (!!value && typeof value === 'object') {
      return `${name}={\n${jsx(value, components, '', idt + 1)}\n${tabs(idt)}}`;
    }
    console.warn(`Propeteer: Unable to evaluate element prop ${name}.`);
    // TODO: Should skip resulting whitespace.
  } else if (typeof value === 'boolean' && value) {
    return name;
  } else if (typeof value === 'boolean' && !value) {
    return `${name}={false}`;
  } else if (typeof value === 'number' || value === null) {
    return `${name}={${value}}`;
  } else if (typeof value === 'object') {
    return `${name}={${JSON.stringify(value)}}`;
  } else if (typeof value === 'string') {
    // TODO: Needs an escape.
    return `${name}="${value}"`;
  }
  return '';
};

const props = (props = {}, components = {}, str, idt) => {
  return Object
    .entries(
      props,
    )
    .reduce(
      (s, [ name, value ]) => {
        return `${s}${tabs(idt)}${prop(name, value, components, idt)}\n`;
      },
      '',
    );
};

const jsx = (def = {}, components = {}, str = '', idt = 0) => {
  const { _: Component, $: children, children: $, ...extraProps } = def;
  if (components.hasOwnProperty(Component)) {
    const hasChildren = Array.isArray(children);
    const hasProps = Object.keys(extraProps).length > 0;
    const defaultProps = (Component.defaultProps || {});
    const ind = tabs(idt);
    const pfx = hasProps ? `${ind}<${Component}\n${props(merge(extraProps, defaultProps), components, '', idt + 1)}${ind}` : `<${Component}`;
    return `${pfx}${hasChildren ? `>\n${children.map(
      child => jsx(child, components, '', idt + 1)
    ).join('\n')}\n${tabs(idt)}</${Component}>` : `/>`}`;
  }
  console.warn(`Propeteer: Unable to find definition of ${Component}. This will be ignored.`);
  return str;
};

const antialias = (flattened, aliases) => Object
  .entries(flattened)
  .reduce(
    (obj, [key, value]) => {
      return {
        ...obj,
        [(aliases[key]) || key]: value,
      };
    },
    {},
  );

const Propeteer = ({ children, LookUpTable, aliases }) => {
  const hasChildren = !!children && typeof children === 'object';
  const hasLookUpTable = !!LookUpTable && typeof LookUpTable === 'object';
  if (hasChildren && hasLookUpTable) {
    const { _: Root } = children;
    if (typeof Root === 'string') {
      const components = flatten(LookUpTable);
      return (
        <JsxParser
          jsx={jsx(unflatten(antialias(flatten(children), flatten(aliases))), components)}
          components={components}
          bindings={components}
          renderInWrapper={false}
        />
      );
    } 
  }
  return null;
};

Propeteer.propTypes = {
  LookUpTable: PropTypes.shape({}),
  children: PropTypes.shape({}),
  aliases: PropTypes.shape({}),
};

Propeteer.defaultProps = {
  LookUpTable: null,
  children: null,
  aliases: {},
};

export default Propeteer;
