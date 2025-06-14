import { Spinner } from 'react-bootstrap';

const Loader = ({ size = 100 }) => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
      <Spinner
        animation="border"
        role="status"
        style={{
          width: size,
          height: size,
          margin: 'auto'
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};

export default Loader;
