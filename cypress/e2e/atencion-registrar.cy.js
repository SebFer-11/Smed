describe('Pruebas de Registrar Atención Médica (RF-06)', () => {

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5500/public/pages/atencion/registrar.html');
  });

  // RA-01: Búsqueda exitosa de paciente
  it('RA-01: Búsqueda exitosa de paciente por DNI', () => {
    cy.get('#dni').type('12345678');
    cy.get('#buscarPacienteForm button[type="submit"]').click();

    cy.get('#dniPaciente').should('contain', '12345678');
    cy.get('#nombrePaciente').should('not.contain', '-');
  });

  // RA-02: Paciente no registrado
  it('RA-02: Búsqueda de paciente no registrado', () => {
    cy.get('#dni').type('99999999');
    cy.get('#buscarPacienteForm button[type="submit"]').click();

    cy.get('#searchMessage')
      .should('be.visible')
      .and('contain', 'No se encontró un paciente con ese DNI');
    cy.get('#nombrePaciente').should('have.text', '-');
  });

  // RA-03: Paciente sin cita programada
  it('RA-03: Paciente registrado sin cita programada', () => {
    cy.get('#dni').type('80000003'); // DNI de paciente registrado sin cita PROGRAMADA
    cy.get('#buscarPacienteForm button[type="submit"]').click();

    cy.get('#searchMessage')
      .should('be.visible')
      .and('contain', 'El paciente no tiene una cita programada');
    cy.get('#fechaCita').should('have.text', 'No disponible');
    cy.get('#medico').should('have.text', 'No disponible');
    cy.get('#especialidad').should('have.text', 'No disponible');
  });

  // RA-04: Validación de campos obligatorios
  it('RA-04: Validación de campos obligatorios del formulario clínico', () => {
    cy.get('#dni').type('12345678');
    cy.get('#buscarPacienteForm button[type="submit"]').click();

    // Dejar anamnesis vacío y llenar el resto
    cy.get('#examenFisico').type('PA: 120/80 mmHg, FC: 76 lpm');
    cy.get('#diagnostico').type('J00 - Rinofaringitis aguda');
    cy.get('#tratamiento').type('Paracetamol 500mg c/8h');
    cy.get('#atencionForm button[type="submit"]').click();

    cy.get('#anamnesis:invalid').should('exist');
  });

  // RA-05: Registro sin paciente seleccionado
  it('RA-05: Registro de atención sin paciente seleccionado', () => {
    cy.get('#anamnesis').type('Paciente refiere malestar general');
    cy.get('#examenFisico').type('PA: 120/80 mmHg');
    cy.get('#diagnostico').type('J00 - Rinofaringitis aguda');
    cy.get('#tratamiento').type('Paracetamol 500mg');
    cy.get('#atencionForm button[type="submit"]').click();

    cy.get('#message')
      .should('be.visible')
      .and('contain', 'Primero debe buscar y seleccionar un paciente');
  });

});