# Redux Thunker

Thunk [middleware](https://redux.js.org/advanced/middleware), a compatible/replacable variation of [redux-thunk v2](https://github.com/gaearon/redux-thunk).

# Table of Contents

1.  [Difference between this lib and redux-thunk](#what-is-the-difference)
2.  [Enhanced Extra Arguments](#enhanced-extra-arguments-your-deps-have-access-to-getstate-and-dispatch)
3.  [Initialization](#initialization)
4.  [API](#api)
5.  [Synergy with redux-promise-middleware](#async-with-redux-thunker--redux-promise-middleware)

## Usage

Installation

```javascript
npm install --save redux-thunker
// or if you use yarn
yarn add redux-thunker
```

Importing

```javascript
// ES6 modules
import createThunkerMiddleware from "redux-thunker";
// require
const createThunkerMiddleware = require("redux-thunker").default;
```

## Why should I use it?

Please see [redux-thunk](https://github.com/gaearon/redux-thunk) for an explanation (I will add more soon:)).

## What is the difference?

By the time when v2 redux-thunk wasn't out yet with injected arguments (.extraArguments), I was using another mw similar to thunk, however during the time I've built some features that made my life easier.

### Single object argument to grab

This is just a small change from redux-thunk, but now you don't have to grab unnecessary getState if you dont'need it, so let's use object destructuring.

```javascript
// redux-thunk
const customAction = args => (dispatch, getState, { fetch }) => {
  // do something with fetch
};

// redux-thunker
const customAction = args => ({ fetch }) => {
  // do something with fetch
};
```

### Enhanced Extra Arguments, your deps have access to getState and dispatch

What does it mean? Simply said, your action deps (extra argument in redux thunk) can have access to your redux state or dispatch without doing extra work. So why would I need the access?

#### Example with fetch

Let's assume that you have an async fetch to your API where a token is required. You can simply have the data in your redux store and since your customized fetch has access to your store, it will grab it automatically from it.

##### Our custom fetch

Our custom fetch has base API ep already set, it also grabs token from the store and injects it into the header if you don't specify it.

```javascript
import fetch from "isomorphic-fetch"; // or any other fetch

// custom fetch
({ getState, dispatch }) => (url, options, ep = "https://your-base.api") => {
  const token = getState().user.token; // getting the token from store

  // you can do some logic if token doesn't exist of course
  const mergedHeaders = {
    ...options.headers,
    Authorization: options.headers.Authorization || `Bearer ${token}`
  };

  const mergedOptions = {
    ...options,
    headers: mergedHeaders
  };

  const api = `${ep}${url}`;

  // you can do more here, like return res.json() instead
  return fetch(api, mergedOptions);
};
```

As you can see, getState and dispatch is passed into the fetch, which is a [currying function](https://www.sitepoint.com/currying-in-functional-javascript/).

##### Store init

Let's initialize and apply our middleware with fetch as an extra argument.
You can also add more deps like getters etc.

```javascript
import { createStore, applyMiddleware } from "redux";
import createThunkerMiddleware from "redux-thunker";
import rootReducer from "./reducers/index";
import fetch from "./injectedFetch";

// with injected deps using single configuration object
const thunk = createThunkerMiddleware({
  extraArgumentsEnhanced: {
    fetch
  }
});

const store = createStore(rootReducer, applyMiddleware(thunk));
```

##### Action

And using it in action using fetch with authorization required:

```javascript
const setEmployeeData = payload => ({
  type: "@employee/SET_DATA",
  payload
});
const setEmployeeError = payload => ({
  type: "@employee/SET_ERROR",
  payload
});

const getEmployeeData = id => ({ fetch }) => {
  fetch(`/employee`) // https://your-base.api/employee
    .then(response => {
      dispatch(setEmployeeData(response));
    })
    .catch(err => {
      dispatch(setEmployeeError("Your error message"));
    });
};
```

## Initialization

As mentioned above, the redux-thunker can replace your redux-thunk in a simple way.

#### init with redux-thunk

```javascript
// redux-thunk
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import rootReducer from "./reducers/index";

// Note: this API requires redux@>=3.1.0
const store = createStore(rootReducer, applyMiddleware(thunk));

// with injected deps
const thunkWithDeps = thunk.withExtraArgument({ fetch, whatever });

const store = createStore(rootReducer, applyMiddleware(thunkWithDeps));
```

#### init with vs redux-thunker

```javascript
import { createStore, applyMiddleware } from "redux";
import createThunkerMiddleware from "redux-thunker";
import rootReducer from "./reducers/index";
import fetch from "./injectedFetch";

const thunk = createThunkerMiddleware();

const store = createStore(rootReducer, applyMiddleware(thunk));

// with injected deps using single configuration object
const thunk = createThunkerMiddleware({
  // optional
  extraArguments: {
    whatever
  },
  // optional
  extraArgumentsEnhanced: {
    fetch
  },
  // optional
  config: {
    reduxThunkCompatible: true,
    continuous: false
  }
});

const store = createStore(rootReducer, applyMiddleware(thunk));
```

This seems like more configuration than necessary, right? See API below.

## API

As shown above, the initialization required a single option object.

```javascript
import createThunkerMiddleware from 'redux-thunker';

const thunkerOptions = {
  config: {
    reduxThunkCompatible: false, // default
    continuous: false, // default
  },
  extraArguments: {
    yourArgument,
    yourArgument2,
    ...
  },
  // optional
  extraArgumentsEnhanced: {
    yourEnhancedArgument,
    yourEnhancedArgument2,
    ...
  },
}
```

### extraArguments

This is the same as you would pass it to reduxThunk.extraArguments()

```javascript
const extraArguments = {
  some,
  thing
};
```

### extraArgumentsEnhanced

Your argument(s) can receive getState and dispatch. Make sure your enhanced is a function accepting single object

```javascript
const customArgumentEnhanced = ({ getState, dispatch }) => ...

const extraArgumentsEnhanced = {
  customArgumentEnhanced
};
```

### config.reduxThunkCompatible

By default, you can grab any injected argument from a single object.

```javascript
const yourAction = arg => ({ dispatch, getState, yourArg }) => {
  // do something
};
```

If you want to replace redux-thunk and don't want to do many changes across your application actions, you can set reduxThunkCompatible to true and you will get the same argument order as in redux-thunk.

```javascript
const yourAction = arg => (dispatch, getState, { yourArg }) => {
  // do something
};
```

### config.continuos

Now, here comes some magic. This option is set to false by default (which behaves the same way as redux-thunk do).

What does it do? Unlike redux-thunk, it dispatches your action even if you return an (action) object.

#### regular redux-thunk

```javascript
// redux-thunk
const toggleMenu = payload => ({
  type: "@ui/MENU_IS_OPEN",
  payload
});

const toggleMenu = id => (dispatch, getState) => {
  const isMenuOpen = getState().ui.isMenuOpen;
  dispatch(toggleMenu(!isMenuOpen));
};
```

#### redux-thunker continuous

```javascript
const toggleMenu = id => ({ getState }) => {
  const isMenuOpen = getState().ui.isMenuOpen;
  return {
    type: "@ui/MENU_IS_OPEN",
    payload: !isMenuOpen
  };
};
```

Now... This is not a thunky idea you might think and you are right. So why would you do this?

There is a great synergy with [redux-promise-middleware](https://github.com/pburtchaell/redux-promise-middleware) which I love to use.

#### async with redux-thunk

```javascript
// for loading UI
const setEmployeeStart = {
  type: "@employee/SET_DATA_PENDING",
  payload
};

// setting data
const setEmployeeSuccess = payload => ({
  type: "@employee/SET_DATA_FULLFILLED",
  payload
});

// do some error
const setEmployeeError = payload => ({
  type: "@employee/SET_DATA_REJECTED",
  payload
});

const getEmployeeData = id => ({ fetch }) => {
  dispatch(setEmployeeStart);

  fetch(`/employee`)
    .then(response => {
      dispatch(setEmployeeSuccess(response));
    })
    .catch(err => {
      dispatch(setEmployeeError("Your error message"));
    });
};
```

#### async with redux-thunker & redux-promise-middleware

```javascript
const getEmployeeData = id => ({ fetch }) => ({
  type: "@employee/SET_DATA",
  payload: fetch(`/employee`)
});
```

Thanks to promise middleware, we don't have to dispatch certain action when your fetch succeeds or fails and it will automatically dispatch new action with a suffix instead, '@employee/SET_DATA_PENDING' on start, '@employee/SET_DATA_FULLFILLED' or '@employee/SET_DATA_REJECTED', which you can handle afterwards in your reducer. And it looks much cleaner!

If you want to delay stuff...

```javascript
const delay = delayAmount =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, delayAmount);
  });

// you can also use delay as argument if you are defining it in multiple places
const getEmployeeData = id => ({ fetch, delay }) => ({
  type: "@employee/SET_DATA",
  payload: delay.then(() => fetch(`/employee`))
});
```

## So ... Do you like it?

Is the doc too confusing? Is it not working? This is my first real repo so let me know your thoughts and ideas of course! PR's are welcome as well!
