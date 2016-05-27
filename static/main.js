/* eslint-env browser */
'use strict';

require('bootstrap-notify');
const React = require('react');
const ReactDOM = require('react-dom');
const $ = require('jquery');

// create renders itself
require('./create');

const RepositoryTable = require('./table');
const PublicUrlForm = require('./public');

var ListApp = React.createClass({
  getInitialState: function() {
    return {data: [], loading: true, editable: false};
  },
  render: function() {
    var publicUrlForm = '';

    if (this.state.editable) {
      publicUrlForm = (
        <div className="row">
          <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1
          col-xs-12">
            <PublicUrlForm initialId={this.state.publicId} />
          </div>
        </div>
      );
    }

    return (
      <div>
        <RepositoryTable data={this.state.data} editable={this.state.editable}
        loading={this.state.loading} />
        {publicUrlForm}
      </div>
    );
  },
  componentDidMount: function() {
    $.ajax({
      url: '/list' + this.props.id + '/repositories',
      dataType: 'json',
      success: (data, status, xhr) => {
        this.setState({
          data: data,
          loading: false,
          editable: !xhr.getResponseHeader('x-readonly'),
          publicId: xhr.getResponseHeader('x-public-id') || ''
        });
      },
      error: function(xhr, status, err) {
        console.error('GET', '/list' + this.props.id + '/repositories',
          err.toString());
        $.notify({
          title: 'Error:',
          message: err.toString()
        }, {
          type: 'danger'
        });
      }
    });
  }
});

ReactDOM.render(
  <ListApp id={window.location.pathname} />,
  document.getElementById('app')
);
