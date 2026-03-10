// backend/pages/apidocs.tsx
import dynamic from 'next/dynamic';

// Carga SwaggerUI dinámicamente sin SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

// Importa el CSS fuera del componente (solo en cliente)
import 'swagger-ui-react/swagger-ui.css';

const ApiDocsPage = () => <SwaggerUI url="/api/api-docs.json" />;

export default ApiDocsPage;