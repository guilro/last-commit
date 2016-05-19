/* eslint-env browser */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

var CreationForm = React.createClass({
  getInitialState: function() {
    var c;
    for (c = ''; c.length < 64;) {
      c += Math.random().toString(36).substr(2, 1);
    }

    return {id: c, valid: true};
  },
  handleIdChange: function(e) {
    var valid = (/^[a-zA-Z0-9_]{1,500}$/).test(e.target.value);
    this.setState({id: e.target.value, valid});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    if (this.state.valid) {
      window.location.href = '/' + this.state.id;
    }
  },
  render: function() {
    return (
      <form className="navbar-form navbar-right" onSubmit={this.handleSubmit}>
        <div className="form-group">
          <label className="sr-only" for="newListId">
            Create a list with a custom ID
          </label>
          <div className="input-group">
            <span className="input-group-addon">
              {window.location.origin}/
            </span>
            <input type="text" className="form-control" value={this.state.id}
              onChange={this.handleIdChange}
              id="newListId" />
            <span className="input-group-btn">
              <button type="submit" className="btn btn-default"
                disabled={!this.state.valid}>
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
