import Badge from '../common/Badge';

export default function StockBadge({ quantity, threshold = 3 }) {
  if (quantity === 0) return <Badge variant="danger">Out of Stock</Badge>;
  if (quantity <= threshold) return <Badge variant="warning">Low Stock ({quantity})</Badge>;
  return <Badge variant="success">In Stock ({quantity})</Badge>;
}
