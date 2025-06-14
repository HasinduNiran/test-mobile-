import { Alert } from 'react-bootstrap';

const ErrorMessage = ({ variant = 'danger', children }) => {
  return (
    <Alert variant={variant} className="my-3">
      {children}
    </Alert>
  );
};

export default ErrorMessage;
