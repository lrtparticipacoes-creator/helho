document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('lead-form').addEventListener('submit', function (event) {
  event.preventDefault();
  document.getElementById('form-status').textContent = 'Obrigado pelo interesse! Este formulário é demonstrativo e ainda precisa ser conectado a um serviço de recebimento.';
});