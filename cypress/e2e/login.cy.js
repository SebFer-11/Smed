
describe('Pruebas del Login', () => {

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5500/public/index.html', {
      onBeforeLoad(win) {
        win.sessionStorage.clear();
      }
    });
  });

  // CP-01: Credenciales correctas
  it('CP-01: Login con credenciales correctas', () => {
    cy.get('#usuario')
      .type('1013456@antoniolorena.com');
    cy.get('#password')
      .type('1013456_Jorge');
    cy.get('#btnLogin').click();
    cy.get('#loginMessage')
      .should('be.visible')
      .and('not.be.empty');
  });

  // CP-02: Credenciales incorrectas
  it('CP-02: Login con credenciales incorrectas', () => {
    cy.get('#usuario')
      .type('usuario999');
    cy.get('#password')
      .type('1013456_Jorge');
    cy.get('#btnLogin').click();
    cy.get('#loginMessage')
      .should('be.visible')
      .and('not.be.empty');
  });

  // CP-03: Campos vacíos
  it('CP-03: Login con campos vacíos', () => {
    cy.get('#btnLogin').click();
    cy.get('#usuarioError')
      .should('be.visible')
      .and('not.be.empty');
    cy.get('#passwordError')
      .should('be.visible')
      .and('not.be.empty');
  });

  // CP-04: Bloqueo después de tres intentos
  it('CP-04: Bloqueo después de tres intentos', () => {
    // Realizar tres intentos fallidos
    for (let i = 0; i < 3; i++) {
      cy.get('#usuario')
        .clear()
        .type('1013456@antoniolorena.com');
      cy.get('#password')
        .clear()
        .type('123');
      cy.get('#btnLogin').click();
    }

    // Verificar que se active el bloqueo
    cy.get('#lockoutMessage')
      .should('be.visible');
    cy.get('#btnLogin')
      .should('be.disabled');
    cy.get('#usuario')
      .should('be.disabled');
    cy.get('#password')
      .should('be.disabled');
    // Verificar que se muestre el tiempo de bloqueo
    cy.get('#countdown')
      .should('be.visible');
  });   
});
