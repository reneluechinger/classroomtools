import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
        <p className="text-muted-foreground">Diese Seite gibt es nicht.</p>
        <Link to="/" className="text-sm font-medium text-primary hover:underline">Zur Startseite</Link>
      </div>
    </div>
  );
}
