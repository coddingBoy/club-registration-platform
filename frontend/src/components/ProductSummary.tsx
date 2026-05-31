const includedItems = [
  "1 x Kappa Training kit, shirt, shorts and socks",
  "1 x Kappa Match kit, shirt, shorts and socks",
  "1 x Kappa Backpack",
  "1 x Kappa Training ball for home use",
  "Head Coach and Assistant Coach per team",
  "Assisted coaching by Sports Performance",
];

const defaultSummaryDetails = [
  "Annual Registration plus first month Tuition Fee: R 2600-00 incl VAT",
  "Monthly Tuition Fee: R 950-00 incl VAT (9 months debit order)",
  "Training sessions once a week every Monday (4 sessions per month)",
  "Time 16:30 - 17:15 (TBC)",
  "Match Day once per week on a Friday (4 match days per month - times TBC)",
  "At the start of season, match day may be replaced for a training day",
  "Approximately 10 players per coach",
];

type ProductSummaryProps = {
  title?: string;
  price?: string;
  label?: string;
  details?: string[];
};

function ProductSummary({
  title = "FIRST TOUCH PROGRAMME REGISTRATION",
  price = "R 2,600.00",
  label = "Registration Product",
  details = defaultSummaryDetails,
}: ProductSummaryProps) {
  return (
    <article className="product-card">
      <div className="product-image-placeholder">
        <span>Programme Image</span>
      </div>

      <div className="product-body">
        <p className="product-label">{label}</p>
        <h2>{title}</h2>
        <p className="product-price">{price}</p>

        <div className="product-divider" />

        <ul className="summary-list">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>

        <div className="product-divider" />

        <h3>Includes</h3>
        <ul className="summary-list includes-list">
          {includedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default ProductSummary;
