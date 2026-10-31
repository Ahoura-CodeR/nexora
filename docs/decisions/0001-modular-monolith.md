# ADR 0001: Start with a modular monolith

- **Status:** Accepted
- **Context:** The project needs clear domain boundaries without the deployment and consistency costs of distributed services.
- **Decision:** Keep one API deployment and one PostgreSQL database. Organize API code by capability (`auth`, `catalog`, `orders`, and `admin`) and keep infrastructure adapters in a separate folder.
- **Consequences:** Local development and transactional order workflows stay straightforward. If scale or team ownership later requires extraction, module boundaries provide a starting point, but extraction will still require explicit contracts and operational work.
