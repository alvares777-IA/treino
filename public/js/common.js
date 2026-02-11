// common.js — Codigo compartilhado entre paginas

var ajaxAtivo = 0;
$.ajaxSetup({
    beforeSend: function() {
        ajaxAtivo++;
        $('button, .btn').prop('disabled', true);
    },
    complete: function() {
        ajaxAtivo--;
        if (ajaxAtivo <= 0) {
            ajaxAtivo = 0;
            $('button, .btn').prop('disabled', false);
        }
    }
});

var tipoUsuario = '';
var idUsuarioSelecionado = null;
var nomeUsuarioSelecionado = '';

function getQueryParam() {
    return idUsuarioSelecionado ? '?id_usuario=' + idUsuarioSelecionado : '';
}

function formatUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
}

function gerenciandoOutro() {
    return idUsuarioSelecionado !== null;
}

// Ler id_usuario e nome da query string (usado em treinos.html quando vem de alunos.html)
function lerParametrosUrl() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id_usuario');
    var nome = params.get('nome');
    if (id) {
        idUsuarioSelecionado = id;
        nomeUsuarioSelecionado = nome || '';
    }
}

// Configurar navbar com base no tipo de usuario
function configurarNavbar() {
    if (tipoUsuario === 'ADM') {
        $('#btnAdmin').removeClass('d-none');
    }
    if (tipoUsuario === 'TRE' || tipoUsuario === 'ADM') {
        $('#btnAlunos').removeClass('d-none');
        $('#btnSolicitacoes').removeClass('d-none');
    }
}

// Carregar tipo do usuario e executar callback
function inicializar(callback) {
    $.ajax({
        url: '/usuario',
        type: 'GET',
        success: function(response) {
            tipoUsuario = response.ao_tipo || 'USU';
            configurarNavbar();
            if (callback) callback(tipoUsuario);
        },
        error: function(xhr) {
            if (xhr.status === 401) { window.location.href = '/index.html'; return; }
            tipoUsuario = 'USU';
            configurarNavbar();
            if (callback) callback(tipoUsuario);
        }
    });
}

$('#btnSair').on('click', function() {
    window.location.href = '/index.html';
});
