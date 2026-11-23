describe('Pruebas de Cancelar Cita Médica (RF-05)', () => {

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5500/public/pages/citas/cancelar.html');
  });

  // CC-01 / UAT-RC-01: Búsqueda exitosa de cita por DNI
  it('CC-01: Búsqueda exitosa de cita médica por DNI', () => {
    cy.get('#dni').type('12345678');
    cy.get('#searchForm button[type="submit"]').click();

    cy.get('#appointmentResult').should('not.have.class', 'hidden');
    cy.get('#message')
      .should('be.visible')
      .and('contain', 'Cita encontrada');
  });

  // CC-02 / UAT-RC-02: DNI con formato incorrecto
  it('CC-02: Validación de DNI con formato incorrecto', () => {
    cy.get('#dni').type('12345');
    cy.get('#searchForm button[type="submit"]').click();

    cy.get('#appointmentResult').should('have.class', 'hidden');
    cy.get('#message')
      .should('be.visible')
      .and('contain', 'El DNI debe tener 8 dígitos');
  });

  // CC-03 / UAT-RC-03: Paciente no registrado
  it('CC-03: Verificación de paciente no registrado', () => {
    cy.get('#dni').type('99999999');
    cy.get('#searchForm button[type="submit"]').click();

    cy.get('#appointmentResult').should('have.class', 'hidden');
    cy.get('#message')
      .should('be.visible')
      .and('contain', 'No se encontró el paciente');
  });

});