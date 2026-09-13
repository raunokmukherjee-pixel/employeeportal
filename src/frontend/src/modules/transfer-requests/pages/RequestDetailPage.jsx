import { useParams } from 'react-router-dom';
import { RequestDetail } from '../components/RequestDetail.jsx';

export function RequestDetailPage() {
  const { id } = useParams();
  return <RequestDetail requestId={id} />;
}
