import { enhanceArguments, thunk } from '../index';

/**
 * mock functions
 */
const getStateMock = () => ({
  user: {
    name: 'Emma Watson',
    occupation: 'Actress',
    status: 'Beautiful',
  },
});

const dispatchMock = () => {};

const defaultArguments = {
  getState: getStateMock,
};

describe('Thunker Middleware', () => {
  const nextHandler = thunk({
    dispatch: dispatchMock,
    getState: getStateMock,
  });

  test('Must return a function to handle action', () => {
    const actionHandler = nextHandler();
    expect(typeof actionHandler).toBe('function');
  });

  test('run action with dispatch and getState', (done) => {
    const actionHandler = nextHandler();

    actionHandler(({ dispatch, getState }) => {
      expect(dispatch).toEqual(dispatchMock);
      expect(getState).toEqual(getStateMock);
      done();
    });
  });

  test('pass to next if not action', (done) => {
    const actionTest = {
      type: 'action',
    };
    const actionHandler = nextHandler((action) => {
      expect(action).toEqual(actionTest);
      done();
    });

    actionHandler(actionTest);
  });

  const nextHandlerCompatible = thunk.extraArguments({
    config: {
      reduxThunkCompatible: true,
    },
  })({
    dispatch: dispatchMock,
    getState: getStateMock,
  });

  describe('Compatible thunk', () => {
    test('run action with dispatch and getState', (done) => {
      const actionHandler = nextHandlerCompatible();

      actionHandler((dispatch, getState) => {
        expect(dispatch).toEqual(dispatchMock);
        expect(getState).toEqual(getStateMock);
        done();
      });
    });
  });

  const nextHandlerCompatibleNotContinuous = thunk.extraArguments({
    config: {
      continuous: true,
    },
  })({
    dispatch: dispatchMock,
    getState: getStateMock,
  });

  describe('Continuos next', () => {
    test('run action with dispatch and getState, has them', (done) => {
      const actionTestResult = {
        type: 'hello',
      };

      const actionTest = ({ getState }) => {
        expect(getState).toEqual(getStateMock);
        return actionTestResult;
      };

      const actionHandler = nextHandlerCompatibleNotContinuous((action) => {
        expect(action).toEqual(actionTestResult);
        done();
      });
      actionHandler(actionTest);
    });
  });
});

describe('Enhancing Arguments', () => {
  test('No arguments to be enhanced, should return null', () => {
    // first param for enhanceArguments
    const suit = [null, {}, undefined];

    suit.forEach((arg) => {
      const enhancedArgs = enhanceArguments(arg, defaultArguments);
      expect(enhancedArgs).toBeNull();
    });
  });

  test('To be enhanced is not a function, error', () => {
    // first param for enhanceArguments
    const suit = [
      {
        notAFunction: {
          sadly: 'an object',
        },
      },
    ];

    suit.forEach((arg) => {
      expect(() => enhanceArguments(arg, defaultArguments)).toThrowError();
    });
  });
  test('Arguments to be enhanced', () => {
    // first param for enhanceArguments
    const input = {
      f: ({ getState }) => () => ({
        type: 'test',
        payload: getState(),
      }),
    };
    const enhanced = enhanceArguments(input, defaultArguments);
    expect(enhanced).toHaveProperty('f');
    expect(typeof enhanced.f).toBe('function');
  });
});
