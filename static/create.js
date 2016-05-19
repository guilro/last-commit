/* eslint-env browser */

const React = require('react');
const ReactDOM = require('react-dom');

var CreationForm = React.createClass({
  getInitialState: function() {
    var c;
    for (c = ''; c.length < 64;) {
      c += Math.random().toString(36).substr(2, 1);
    }

    return {id: c};
  },
  handleIdChange: function(e) {
    this.setState({id: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    window.location.href = '/' + this.state.id;
  },
  render: function() {
    return (
      <form className="navbar-form navbar-right" role="search"
        onSubmit={this.handleSubmit}>
        <div className="form-group">
          <div className="input-group">
            <input type="text" className="form-control" value={this.state.id}
              onChange={this.handleIdChange}/>
            <span className="input-group-btn">
              <button type="submit" className="btn btn-default">
                Create my list
              </button>
            </span>
          </div>
        </div>
      </form>
    );
  }
});

ReactDOM.render(
  <CreationForm />,
  document.getElementById('creationForm')
);
