describe('Pruebas de Registro de Paciente (RF-01)', () => {

  beforeEach(() => {
    cy.visit('http://127.0.0.1:5500/public/pages/pacientes/registrar.html');
  });

  // CP-01: Registro exitoso de paciente con datos válidos (DNI e HC nuevos)
  it('CP-01: Registro exitoso de paciente con datos válidos', () => {
    const sufijo = Date.now().toString().slice(-4);
    const dniNuevo = `7412${sufijo}`;
    const hcNueva = `HC-74${sufijo}`;

    cy.get('#fecha').type('2026-11-22');
    cy.get('#hora').type('23:39');
    cy.get('#seguro').select('si');
    cy.get('#sis').type('SIS-902341');
    cy.get('#origen').type('Centro de Salud Belenpampa (Cusco)');
    cy.get('#destino').clear().type('Hospital Antonio Lorena');
    cy.get('#historia').type(hcNueva);
    cy.get('#dni').type(dniNuevo);
    cy.get('#nombres').type('María');
    cy.get('#apellidos').type('Torres Díaz');
    cy.get('#sexo').select('femenino');
    cy.get('#edad').type('30');
    cy.get('#direccion').type('Av. La Cultura 123');
    cy.get('#departamento').select('cusco');
    cy.get('#distrito').type('Santiago');
    cy.get('#ups').select('emergencia');
    cy.get('#especialidad').select('ginecologia');
    cy.get('#condicion').select('delicado');
    cy.get('#refNombre').type('Dra. Patricia Valenzuela');
    cy.get('#refProfesion').select('medico');
    cy.get('#estNombre').type('Dr. Juan Carlos Ramos');
    cy.get('#estProfesion').select('medico');

    cy.get('#btnSubmitPaciente').click();

    cy.get('#message')
      .should('be.visible')
      .and('contain', 'Paciente registrado correctamente');
  });

  // CP-02: Validación de DNI duplicado
  it('CP-02: Validación de DNI duplicado', () => {
    cy.get('#btnAutoFill').click();
    cy.get('#dni').clear().type('45678912'); // DNI ya existente en Supabase
    cy.get('#historia').clear().type('HC-999888');
    cy.get('#btnSubmitPaciente').click();

    cy.get('#message')
      .should('be.visible')
      .and('contain', 'Ya existe un paciente registrado con ese DNI');
  });

  // CP-RP-03: Validación de Historia Clínica duplicada
  it('CP-RP-03: Validación de Historia Clínica duplicada', () => {
    const dniUnico = `9638${Date.now().toString().slice(-4)}`;

    cy.get('#btnAutoFill').click();
    cy.get('#dni').clear().type(dniUnico); // DNI nuevo que no existe
    cy.get('#historia').clear().type('HC-000456'); // HC que SÍ existe en Supabase
    cy.get('#btnSubmitPaciente').click();

    cy.get('#message')
      .should('be.visible')
      .and('contain', 'El número de Historia Clínica ya está registrado');
  });

  // CP-04: Validación de formato incorrecto de DNI
  it('CP-04: Validación de formato incorrecto de DNI', () => {
    cy.get('#btnAutoFill').click();
    cy.get('#dni').clear().type('1234567');
    cy.get('#btnSubmitPaciente').click();

    cy.get('#message')
      .should('be.visible')
      .and('contain', 'El documento de identidad debe tener 8 dígitos');
  });

  // CP-05: Validación de edad no válida (> 105)
  it('CP-05: Validación de edad no válida', () => {
    cy.get('#btnAutoFill').click();
    cy.get('#edad').clear().type('110');
    cy.get('#btnSubmitPaciente').click();

    cy.get('#message')
      .should('be.visible')
      .and('contain', 'Ingrese una edad válida');
  });

});