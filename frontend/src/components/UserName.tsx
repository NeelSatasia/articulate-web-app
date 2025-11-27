import { useEffect, useState } from 'react';
import api from '../api';

interface User {
  id: number;
  name: string;
  created_at: string;
}

const UserName = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const resp = await api.get('/users/');
        setUsers(resp.data);
      } catch (error) {
        console.error("Error fetching users", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Users</h1>

      <ul className="list-group">
        {users.map((user) => (
          <li className="list-group-item" key={user.id}>
            <strong>{user.name}</strong> — {new Date(user.created_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserName;