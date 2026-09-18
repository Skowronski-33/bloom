(async function protegerPainel() {
  try {
    const resposta = await fetch('api/auth.php', { cache: 'no-store' });
    const dados = await resposta.json();
    if (dados.autenticado === true) {
      document.documentElement.classList.add('admin-autorizado');
      return;
    }
  } catch (erro) {
    // A página de login exibirá uma mensagem caso a API não esteja disponível.
  }
  window.location.replace('admin-login.html');
})();