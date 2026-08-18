import { Component } from "react";

/**
 * Catches render errors anywhere below it and shows a chalkboard-
 * styled crash screen instead of a blank white page. Reset is a full
 * reload rather than clearing local component state, since a session
 * was never persisted anyway (see README — everything resets on
 * reload already) and reloading is the only way to guarantee we're
 * not just re-rendering into whatever broke in the first place.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Gridiron Read Trainer crashed:", error, info);
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="board-wrap">
        <div className="inner">
          <h1 className="title">WHISTLE BLOWN</h1>
          <p className="subtitle">
            Play's dead — something broke mid-rep. Not on you; nothing
            was saved anyway, so a reset costs you nothing but the rep.
          </p>
          <button className="btn-continue" onClick={this.handleReset}>
            Reset &amp; Get Back On The Field
          </button>
        </div>
      </div>
    );
  }
}
