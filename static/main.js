/* eslint-env browser */

const moment = require('moment');
const React = require('react');
const ReactDOM = require('react-dom');
const $ = require('jquery');

var Repository = React.createClass({
  render: function() {
    return (
      <tr>
        <td>
          <span class="text-muted">{this.props.repository.url.host}/</span><a href={this.props.repository.url}><b>{this.props.repository.url.path.slice(1)}</b></a>
        </td>
        <td>
          {moment(this.props.repository.lastCommit.createdAt).fromNow()} <br/>
          ({this.props.repository.lastCommit.createdAt})
        </td>
        <td> {this.props.repository.lastCommit.message} </td>
        <td>
          {this.props.repository.lastCommit.authorName} <br/>
          &lt;{this.props.repository.lastCommit.authorEmail}&gt;
        </td>
      </tr>
    );
  }
});

var RepositoryTable = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/repositories',
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error('/api', status, err.toString());
      }
    });
  },
  render: function() {
    var tableLines = this.state.data.map(
      repo => (<Repository key={repo.url.host + repo.url.path} repository={repo} />)
    );

    return (
      <table className="table">
        <thead>
          <tr>
            <th>URL</th>
            <th>Last commit</th>
            <th>Message</th>
            <th>Author</th>
          </tr>
        </thead>
        <tbody>
          {tableLines}
        </tbody>
      </table>
    );
  }
});

ReactDOM.render(
  <RepositoryTable />,
  document.getElementById('app')
);
