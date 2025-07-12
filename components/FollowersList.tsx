import { useState, useEffect } from "react";

export default function FollowersList({ orderId }) {
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    async function fetchFollowers() {
      try {
        const response = await fetch(`/api/followers/${orderId}`);
        const data = await response.json();
        if (data.success) {
          setFollowers(data.followers);
        }
      } catch (error) {
        console.error("Error fetching followers:", error);
      }
    }
    fetchFollowers();
  }, [orderId]);

  return (
    <div className="mt-2">
      <h4 className="text-sm font-medium">Followers</h4>
      {followers.length === 0 ? (
        <p className="text-sm text-gray-500">No followers yet.</p>
      ) : (
        <ul className="list-disc pl-5 text-sm">
          {followers.map((follower) => (
            <li key={follower._id}>
              @{follower.followedByUsername} (FID: {follower.followedByFid})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}