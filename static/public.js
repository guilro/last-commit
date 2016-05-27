/* eslint-env browser */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const $ = require('jquery');

var pathname = window.location.pathname;

var PublicUrlForm = React.createClass({
  getInitialState: function() {
    console.log('prop', this.props.initialId);
    return {
      id: this.props.initialId || '',
      valid: this.props.initialId ? 'success' : 'unkown'
    };
  },
  handleIdChange: function(e) {
    var valid = (/^[a-zA-Z0-9_]{1,500}$/).test(e.target.value);
    this.setState({id: e.target.value, valid: valid ? 'unkown' : 'error'});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var publicId = this.state.id;
    $.ajax({
      method: 'PATCH',
      url: '/list' + pathname,
      data: JSON.stringify({publicId}),
      success: () => {
        this.setState({id: this.state.id, valid: 'success'});
      },
      error: (xhr, status, err) => {
        console.error('PATCH', '/list' + pathname, err.toString());
        this.setState({id: this.state.id, valid: 'error'});
      },
      dataType: 'json',
      contentType: 'application/json'
    });
  },
  render: function() {
    var formClass = '';
    formClass = 'has-' + this.state.valid;

    return (
      <form onSubmit={this.handleSubmit}>
        <div className={['form-group', formClass].join(' ')}>
          <p className="lead text-center">
            Read-only URL
          </p>
          <p className="visible-xs">{window.location.origin}/</p>
          <div className="input-group">
            <span className="input-group-addon hidden-xs">
              {window.location.origin}/
            </span>
            <input type="text" className="form-control" value={this.state.id}
              onChange={this.handleIdChange} placeholder="YourPublicUrl"
              id="publicUrl" />
            <span className="input-group-btn">
              <button type="submit" className="btn btn-default"
                disabled={!this.state.valid}>
                Use<span className="hidden-xs"> this url</span>
              </button>
            </span>
          </div>
        </div>
      </form>
    );
  }
});

module.exports = PublicUrlForm;
