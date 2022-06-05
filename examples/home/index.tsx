import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

function App() {
  const location = useLocation();
  useEffect(() => {
    console.log(1, location);
  }, [location]);
  return (
    <div className="mx-auto container">
      <ul>
        <li>
          <Link to="/?v=1" replace state={{ ts: Date.now() }}>
            v1
          </Link>
        </li>
        <li>
          <Link to="/?v=2" state={{ ts: Date.now() }}>
            v2
          </Link>
        </li>
        <li>
          <Link to="/?v=3" state={{ ts: Date.now() }}>
            v3
          </Link>
        </li>
        <li>
          <Link to="/test" state={{ ts: Date.now() }}>
            test
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default App;
