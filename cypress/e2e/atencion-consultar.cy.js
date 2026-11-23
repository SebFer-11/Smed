describe('Pruebas de Consulta de Historial Clínico (RF-07)', () => {

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5500/public/pages/atencion/consultar.html');
  });

  // CP-CA-01: Consulta exitosa del historial clínico
  it('CP-CA-01: Consulta exitosa del historial clínico', () => {
    cy.get('#dni').type('45678912');
    cy.get('#buscarForm button[type="submit"]').click();

    cy.get('#dniPaciente').should('contain', '45678912');
    cy.get('#historial .attention-item').should('have.length.at.least', 1);
  });

  // CP-CA-02: Búsqueda de paciente no registrado
  it('CP-CA-02: Búsqueda de paciente no registrado', () => {
    cy.get('#dni').type('99999999');
    cy.get('#buscarForm button[type="submit"]').click();

    cy.get('#searchMessage')
      .should('be.visible')
      .and('contain', 'No se encontró el paciente');
    cy.get('#historial').should('contain', 'No se encontraron atenciones para este paciente');
    cy.get('#detalleSection').should('not.be.visible');
  });

  // CP-CA-03: Paciente sin atenciones registradas
  it('CP-CA-03: Paciente registrado sin atenciones médicas', () => {
    cy.get('#dni').type('80000003'); // Paciente existente sin filas en atenciones
    cy.get('#buscarForm button[type="submit"]').click();

    cy.get('#dniPaciente').should('contain', '80000003');
    cy.get('#historial').should('contain', 'El paciente no tiene atenciones registradas');
    cy.get('#detalleSection').should('not.be.visible');
  });

});