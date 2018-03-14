export const defaultConfig = {
  reduxThunkCompatible: false,
};

export const enhanceArguments = (extraArguments, injectedArguments) => {
  if (!extraArguments || Object.keys(extraArguments).length === 0) {
    return null;
  }
  const keys = Object.keys(extraArguments);
  const enhancedArguments = keys.reduce((ea, key) => {
    const toBeEnhanced = extraArguments[key];
    if (typeof toBeEnhanced !== 'function') {
      // eslint-disable-next-line max-len
      throw new Error(`[redux-thunker] Property ${key} is not a function. Only functions can be enhanced.`);
    }
    return {
      ...ea,
      [key]: toBeEnhanced(injectedArguments),
    };
  }, {});
  return enhancedArguments;
};

const thunkerMiddleware = ({
  extraArguments,
  extraArgumentsEnhanced,
  config: { reduxThunkCompatible } = defaultConfig,
} = {}) => ({ dispatch, getState }) => next => (action) => {
  if (typeof action === 'function') {
    /**
     * enhance desired arguments
     */
    const enhancedArguments = enhanceArguments(extraArgumentsEnhanced, {
      dispatch,
      getState,
    });

    /**
     * if backward compatibility with redux-thunk is required
     *
     * usage: (dispatch, getState, { ...extraArgumentsAndEnhancedArguments }) =>
     *
     * otherwise by default
     *
     * usage: ({ dispatch, getState, ...extraArgumentsAndEnhancedArguments }) =>
     *
     * so you don't have to pick disptach or getState when you don't need it
     */
    return reduxThunkCompatible
      ? action(dispatch, getState, {
        ...extraArguments,
        ...enhancedArguments,
      })
      : action({
        dispatch,
        getState,
        ...extraArguments,
        ...enhancedArguments,
      });
  }

  return next(action);
};

const thunk = thunkerMiddleware();
thunk.extraArguments = thunkerMiddleware;

export { thunk };

export default thunkerMiddleware;
