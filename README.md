# propeteer
🧸Config comes in, React comes out.. This project adheres to [Semantic Versioning](https://docs.npmjs.com/about-semantic-versioning).

## 🚀 Getting Started

Using [`npm`]:

```sh
npm install --save propeteer
```

Using [`yarn`]:

```sh
yarn add propeteer
```

## 🤔 Why does this exist?

Some interfaces we present to the user are defined by pure config; this is especially true for [white label applications](https://www.quora.com/What-are-white-label-apps), where the presentation value of your solution directly correlates against how configurable it can be.

In traditional frontend development, an API serves you some JSON which you're expected to translate into your frontend. This normally means that whenever future enhancements are made to the response, clients are required to update parsers and manage the propagation of this data into their DOM.

By defining props using _config_, we have the entire breadth of React at our disposal, since your config _is_ exactly what is presented, and all the meaningful intepretations are already made possible to you by React and the custom components you deploy. Meanwhile, any referenced compnents in config can themselves can define the sensible default values, or be internally wrapped using operation-critical components.

In addition, bespoke customization of deeply-nested components in React can also be very tricky. It's not often that you import a project dependency that fits your application theme. Similarly, they require you to _trust_ the implemetor to expose the correct configuration properties for all levels, for each component, or accept a lot of your [pull requests](). This can be particularly obstructive to development when all you care about is the intrinsic _capabilities_ of library, but not the subjective presentation that you're forced to use alongside it.

[Propeteer]() aims to solve these problems:

  - Presented components are a function of serializable, transportable config objects.
  - Libraries created using Propeteer permit arbitrary bespoke configuration of the graphical frontend, whilst maintaining the functionality that matters to implemetors.
  - Dynamic components rendered using Propeteer may have a working knowledge of application state, so it is possible to achieve stateful operations, or full working applications, just while using conventional config.

## 🔤 Syntax Rules

Propeteer is pretty straight forward. Anything in your config is treated as a component prop, apart from the following reserved keys:

#### `_`
Defines a Component reference, i.e.

```json
{
  "_": "Fragment",
  "key": "someFragmentKey"
}
```

#### `$`
Defines an array of children, who are themselves defined using config. By leveraging the power of

```json
{
  "_": "Fragment",
  "$": [
    {
      "_": "View",
      "style": {
        "flex": 1,
        "backgroundColor": "green",
      }
    }
  ]
}
```

#### `children`
Any config prop declared using the key `children` will be _ignored_.

## ✍️ Examples

### Hello, world!

To get started, let's take a look at what a "Hello, world!" looks like in Propeteer.

  - Implementors define a `LookUpTable` of React elements which can be referenced by config.
    - Any elements referred to in config which do not exist will not be rendered, and will instead trigger a warning.
  - A `<Propeteer />` is passed a configuration object via the `children` prop.
    - This config is evaluated into an equivalent React layout. In this example, we draw a blue box with a `<TextInput />` in the center.

```javascript
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Propeteer from 'propeteer';

export default () => (
  <Propeteer
    LookUpTable={{
      View,
      TextInput,
    }}
    children={{
      _: 'View',
      style: [
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'skyblue',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ],
      $: [
        {
          _: 'TextInput',
          placeholder: 'Hello, world!',
        },
      ],
    }}
  />
);

```

## Overriding and Application State

In the example below, we can demonstrate that the components that config JSON refer to can be dynamically implemented on the runtime.

This means that:
  - We can inject useful properties and behaviours with client-side awareness in place of standard references.
    - This way, it is easy to apply application-specific properties in addition to, or in lieu of, the config-defined ones.
  - We can connect these components to sources of global application state.
    - Self managing components, such as those that `useEffect`, can begin to manage, manipulate and respond to the runtime state.

```javascript
import React from 'react';
import { View } from 'react-native';
import Provider, { connect } from 'react-redux';
import Propeteer from 'propeteer';

import configureStore from './configureStore';

const ReduxConnectedComponent = connect()(View);

const store = configureStore();

export default () => (
  <Provider
    store={store}
  >
    <Propeteer
      LookUpTable={{
        ReduxConnectedComponent: ({ ...extraProps }) => (
          <ReduxConnectedComponent
            {...extraProps}
            someClientSpecificProp
          />
        ),
      }}
      children={{
        _: 'ReduxConnectedComponent',
      }}
    />
  </Provider>
);

```

## Portable Libraries

This demonstration is a little more involved, but it covers all the basic techniques you need to create an unopinionated frontend library whose functionality is overridable.

The important themes to note are:

  - We don't have decide which properties or components should be overridable.
    - Conventionally, React developers must put forethought into deciding which components should be configurable, or which properties should be passed around, or whether a `<Provider />` should be deployed. Using Propeteer, anything expressed as config is inherently overridable.
  - Components can be stateful.
    - In this demonstration, we utilise `SomeUsefulComponent` to perform some abstract functionality intended to be served by the library. Below we prove this functionality can still be maintained, even when the surrounding presentation context has changed.
  - We can decide which properties we _don't_ want to be overrided.
    - Elements that are mission critical, we don't want to be overrided. In these cases, we can prioritize the input `LookUpTable` to ensure core components  are always persisted.

```javascript
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableOpacity, Platform, View, Text } from 'react-native';
import Propeteer from './Propeteer';
import { merge } from 'lodash';

// XXX: A simple component which has the ability to store and regenerate a random number.
const SomeUsefulComponent = ({ FrontEnd, ...extraProps }) => {
  const [ secret, setSecret ] = useState(
    Math.random(),
  );
  return (
    <FrontEnd
      {...extraProps}
      secret={secret}
      regenerate={() => setSecret(Math.random())}
    />
  );
};

SomeUsefulComponent.propTypes = {
  FrontEnd: PropTypes.elementType,
};

SomeUsefulComponent.defaultProps = {
  // The default FrontEnd prop just renders text string, and hides the secret value.
  FrontEnd: ({ secret, regenerate, ...extraProps }) => (
    <Text
      children="Hello!"
    />
  ),
};

// XXX: The library defines the entire default configuration of the resulting component.
const Library = ({ LookUpTable: lut, children, aliases, ...extraProps }) => {
  // XXX: Mix the default props of the Library with the supplied config.
  const LookUpTable = {
    ...Library.defaultProps.LookUpTable,
    ...(lut || {}),
  };
  return (
    <Propeteer
      LookUpTable={LookUpTable}
      aliases={aliases}
      children={merge(
        {...Library.defaultProps.children},
        (children || {}),
      )}
    />
  );
};

Library.propTypes = {
  ...Propeteer.propTypes,
};

Library.defaultProps = {
  LookUpTable: {
    SomeUsefulComponent,
    GlobalLayout: ({ children, style, ...extraProps }) => (
      <View
        style={[
          StyleSheet.absoluteFill,
          style,
        ]}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'orange',
          }}
        />
        {children}
      </View>
    ),
  },
  // XXX: To ease nested references, you can optionally specify aliases that resolve
  // to equivalent paths in your config.
  aliases: {
    'FrontEndHook': '$.0.FrontEnd',
  },
  // XXX: Renders the global layout with a single <SomeUsefulComponent />
  children: {
    _: 'GlobalLayout',
    $: [
      { _: 'SomeUsefulComponent' },
    ],
  },
};

// XXX: As a library consumer, this is all you see:
export default () => (
  <Library
    LookUpTable={{
      ExposeSecret: ({ secret, regenerate, ...extraProps }) => (
        <TouchableOpacity
          onPress={regenerate}
        >
          <Text
            {...extraProps}
            children={`The secret is ${secret}!`}
          />
        </TouchableOpacity>
      ),
    }}
    children={{
      // XXX: We choose to override the FrontEnd using our custom
      //      ExposeSecret component. This has the ability to
      //      render the secret, and regenerate a new secret onPress.
      'FrontEndHook': 'ExposeSecret',
    }} 
  />
```

## ✌️ License
[MIT](https://opensource.org/licenses/MIT)
