import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description?: string;
  path?: string;
}

const SITE_NAME = 'BillXpress';
const BASE_URL = 'https://billxpress1.vercel.app';
const DEFAULT_DESC = 'Pay bills, buy airtime, data, TV subscriptions, electricity, and more with BillXpress. Fast, secure VTU services in Nigeria.';

export default function Seo({ title, description = DEFAULT_DESC, path = '/' }: SeoProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
