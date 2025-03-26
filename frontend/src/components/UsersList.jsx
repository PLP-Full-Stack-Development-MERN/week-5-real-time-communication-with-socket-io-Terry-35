import React from "react";

export const UsersList = ({ users }) => {
  return (
    <div className="users-list">
      <h3>Online Users ({users.length})</h3>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
};