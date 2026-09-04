export interface StateDefinition<State extends string> {
  enter?: (previousState?: State) => void;
  exit?: (nextState: State) => void;
}

export class StateMachine<State extends string> {
  private currentState: State;

  constructor(
    initialState: State,
    private readonly states: Partial<Record<State, StateDefinition<State>>> = {},
  ) {
    this.currentState = initialState;
    this.states[initialState]?.enter?.();
  }

  get state(): State {
    return this.currentState;
  }

  is(state: State): boolean {
    return this.currentState === state;
  }

  setState(nextState: State): boolean {
    if (nextState === this.currentState) {
      return false;
    }

    const previousState = this.currentState;
    this.states[previousState]?.exit?.(nextState);
    this.currentState = nextState;
    this.states[nextState]?.enter?.(previousState);
    return true;
  }
}
