import ProductSummary from "./components/ProductSummary";
import RegistrationForm from "./components/RegistrationForm";

function App() {
  return (
    <div className="site-shell">
      <header className="club-header">
        <div className="header-inner">
          <div className="club-mark" aria-hidden="true">
            CTS
          </div>
          <div>
            <p className="header-kicker">Cape Town Spurs Academy</p>
            <h1>FIRST TOUCH PROGRAMME REGISTRATION</h1>
          </div>
        </div>
      </header>

      <main className="page-layout">
        <section className="form-card" aria-labelledby="registration-title">
          <div className="intro-panel">
            <p>Please fill in the complete form below, before proceeding to checkout.</p>
            <p>
              To register an additional child, you will need to first complete the process
              for the first child.
            </p>
            <p>
              Registration and acceptance to the school will be confirmed via full
              registration payment and approval of debit order acceptance by Nedbank.
            </p>
          </div>

          <RegistrationForm />
        </section>

        <aside className="summary-column" aria-label="Product summary">
          <ProductSummary />
        </aside>
      </main>
    </div>
  );
}

export default App;
