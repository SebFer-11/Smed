describe('Pruebas de Consulta de Paciente (RF-02)', () => {

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5500/public/pages/pacientes/consultar.html');
  });

  // CP-01 / UAT-01: Consulta exitosa mediante DNI
  it('CP-01: Consulta exitosa de paciente mediante DNI', () => {
    cy.get('#searchType').select('dni');
    cy.get('#searchValue').type('12345678');
    cy.get('#btnSearchSubmit').click();

    cy.get('#patientResult').should('not.have.class', 'hidden');
    cy.get('#patientName').should('contain', 'Juan Pérez Quispe');
    cy.get('#patientHistory').should('contain', 'HC-000123');
    cy.get('#patientSIS').should('contain', 'SIS-123456');
  });

  // CP-02 / UAT-02: Validación de formato incorrecto de DNI
  it('CP-02: Validación de formato incorrecto de DNI', () => {
    cy.get('#searchType').select('dni');
    cy.get('#searchValue').type('1234567');
    cy.get('#btnSearchSubmit').click();

    cy.get('#patientResult').should('have.class', 'hidden');
    cy.get('#message')
      .should('be.visible')
      .and('contain', 'El DNI debe contener exactamente 8 números');
  });

  // CP-03 / UAT-03: Consulta de paciente inexistente
  it('CP-03: Consulta de paciente inexistente por Historia Clínica', () => {
    cy.get('#searchType').select('historia');
    cy.get('#searchValue').type('XX-000999');
    cy.get('#btnSearchSubmit').click();

    cy.get('#patientResult').should('have.class', 'hidden');
    cy.get('#message')
      .should('be.visible')
      .and('contain', 'No se encontró ningún paciente registrado');
  });

});