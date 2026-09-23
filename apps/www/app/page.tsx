import { productHosts } from "@liveaskew/ui/tokens";

const products = [
  {
    name: "Bee",
    logo: "/bee.png",
    host: productHosts.bee,
    line: "The styling app for working mothers. Maternity to the boardroom. Clothes follow the body.",
  },
  {
    name: "The Hive",
    logo: "/hive.png",
    host: productHosts.hive,
    line: "One community. Sign in with Google, Apple, Instagram, Facebook, or TikTok and talk in the same rooms.",
  },
  {
    name: "The Buzz",
    logo: "/buzz.png",
    host: productHosts.buzz,
    line: "Bee sends the look. Buzz schedules it to Instagram, TikTok, Pinterest, Facebook, and LinkedIn.",
  },
];

export default function HomePage() {
  return (
    <div className="house">
      <header className="house-head">
        <img className="signature" src="/liveaskew-signature.png" alt="LiveAskew" />
        <a className="neo-link" href={`https://${productHosts.bee}`}>
          Enter Bee
        </a>
      </header>
      <section className="house-hero">
        <p className="kicker">LiveAskew</p>
        <h1>Three products. One house.</h1>
        <p>
          Bee dresses you. The Hive is where you talk. The Buzz posts the look. Each one ships on
          its own.
        </p>
      </section>
      <section className="products">
        {products.map((product) => (
          <a key={product.host} className="product" href={`https://${product.host}`}>
            <img src={product.logo} alt="" />
            <p className="host">{product.host}</p>
            <h2>{product.name}</h2>
            <p>{product.line}</p>
          </a>
        ))}
      </section>
    </div>
  );
}
