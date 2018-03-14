const defaultConfig = {
  reduxThunkCompatible: false,
};

const enhanceArguments = (extraArguments, injectedArguments) => {
  if (!extraArguments) {
    return null;
  }
  const keys = Object.keys(extraArguments);
  const enhancedArguments = keys.reduce(
    (ea, key) => ({
      ...ea,
      key: extraArguments[key](injectedArguments),
    }),
    {},
  );
  return enhancedArguments;
};

const thunker = ({
  extraArguments,
  extraArgumentsEnhanced,
  config: { reduxThunkCompatible } = defaultConfig,
}) => ({ dispatch, getState }) => next => (action) => {
  if (typeof action === 'function') {
    // enhance desired arguments
    const enhancedArguments = enhanceArguments(extraArgumentsEnhanced, {
      dispatch,
      getState,
    });

    /**
     * if backward compatibility with redux-thunk is required
     *
     * usage: (dispatch, getState, { ...extraArgumentsAndEnhancedArguments }) =>
     */
    if (reduxThunkCompatible) {
      return next(action(dispatch, getState, {
        ...extraArguments,
        ...enhancedArguments,
      }));
    }

    /**
     * otherwise
     *
     * usage: ({ dispatch, getState, ...extraArgumentsAndEnhancedArguments }) =>
     *
     * so you don't have to pick disptach or getState when you don't need it
     */
    next(action({
      dispatch,
      getState,
      ...extraArguments,
      ...enhancedArguments,
    }));
  }

  return next(action);
};

export default thunker;
