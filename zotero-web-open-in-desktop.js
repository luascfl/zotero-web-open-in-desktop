// ==UserScript==
// @name         Zotero Web - Botão "Abrir no Desktop"
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Adiciona um botão 'Abrir no Desktop' ao lado das outras abas em páginas de itens do Zotero Web, usando o protocolo zotero://. Usa MutationObserver.
// @author       luascfl
// @match        https://www.zotero.org/*
// @icon         https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQV_MA7Vf6pToxR-d07GVMKROpt6L0Zwg479w&s
// @home            https://github.com/luascfl/zotero-web-open-in-desktop
// @supportURL      https://github.com/luascfl/zotero-web-open-in-desktop/issues
// @updateURL       https://raw.githubusercontent.com/luascfl/zotero-web-open-in-desktop/main/zotero-web-open-in-desktop.js
// @downloadURL     https://raw.githubusercontent.com/luascfl/zotero-web-open-in-desktop/main/zotero-web-open-in-desktop.js
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // *** MUDANÇA 1: Log Prefix atualizado (opcional, para clareza) ***
    const logPrefix = '[Zotero Abrir Desktop]:';
    const itemUrlRegex = /https:\/\/www\.zotero\.org\/(?:[^/]+|(?:groups|users)\/[^/]+(?:\/[^/]+)?)\/collections\/([A-Z0-9]+)\/items\/([A-Z0-9]+)/;
    const tabContainerSelector = 'div.nav.tabs[role="tablist"]';
    // *** MUDANÇA 2: ID do link atualizado (opcional, para refletir nome) ***
    const linkId = 'dynamic-zotero-abrir-desktop-link'; // Novo ID

    let currentObserver = null;

    function parseZoteroUrl(url) {
        const match = url.match(itemUrlRegex);
        if (match && match[1] && match[2]) {
            return { collectionKey: match[1], itemKey: match[2] };
        }
        return null;
    }

    /**
     * Adiciona o link 'Abrir no Desktop' dentro do container de abas especificado.
     * @param {Element} tabContainer O elemento DIV que contém as abas.
     * @param {string} collectionKey A chave da coleção Zotero.
     * @param {string} itemKey A chave do item Zotero.
     */
    function addProtocolLink(tabContainer, collectionKey, itemKey) {
        console.log(logPrefix, '>>> Tentando adicionar link no container:', tabContainer);

        if (tabContainer.querySelector(`#${linkId}`)) {
             // *** MUDANÇA 3: Mensagem de log atualizada ***
            console.log(logPrefix, 'Link "Abrir no Desktop" já existe neste container. Nada a fazer.');
            return;
        }

        const protocolUrl = `zotero://select/library/collections/${collectionKey}/items/${itemKey}`;
        const protocolLink = document.createElement('a');
        protocolLink.href = protocolUrl;
        protocolLink.id = linkId; // Usa o novo ID
        // *** MUDANÇA 4: Texto do link alterado ***
        protocolLink.textContent = 'Abrir no Desktop';
        protocolLink.setAttribute('target', '_blank');
         // *** MUDANÇA 5: Tooltip (title) do link alterado ***
        protocolLink.title = `Abrir item no App Zotero Desktop: ${protocolUrl}`;

        protocolLink.classList.add('tab');
        protocolLink.setAttribute('role', 'tab');
        protocolLink.style.textDecoration = 'none';
        protocolLink.style.cursor = 'pointer';
        protocolLink.setAttribute('aria-selected', 'false');
        protocolLink.setAttribute('tabindex', '-2'); // Tenta usar -2 como no exemplo anterior, ajuste se necessário

         // *** MUDANÇA 6: Mensagem de log atualizada ***
        console.log(logPrefix, '>>> ADICIONANDO o link "Abrir no Desktop" ao container:', protocolLink);
        tabContainer.appendChild(protocolLink);
        console.log(logPrefix, '>>> Link "Abrir no Desktop" adicionado com sucesso.');
    }

    /**
     * Remove o link customizado da página, se existir.
     */
    function removeProtocolLink() {
        const protocolLink = document.getElementById(linkId); // Procura pelo novo ID
        if (protocolLink) {
             // *** MUDANÇA 7: Mensagem de log atualizada ***
            console.log(logPrefix, 'Removendo link "Abrir no Desktop" customizado (ID: ' + linkId + ').');
            protocolLink.remove();
        }
    }

    /**
     * Observa o DOM pela aparição do container de abas e chama addProtocolLink.
     * @param {string} collectionKey A chave da coleção Zotero.
     * @param {string} itemKey A chave do item Zotero.
     */
    function observeForTabContainer(collectionKey, itemKey) {
        if (currentObserver) {
            currentObserver.disconnect();
        }

        const targetNode = document.body;
        console.log(logPrefix, `Iniciando observer no ${targetNode.tagName} para encontrar '${tabContainerSelector}'...`);
        const config = { childList: true, subtree: true };

        const callback = function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            let tabContainer = null;
                            if (typeof node.matches === 'function' && node.matches(tabContainerSelector)) {
                                tabContainer = node;
                                console.log(logPrefix, `Observer: Container de abas ADICIONADO diretamente.`);
                            }
                            else if (typeof node.querySelector === 'function') {
                                tabContainer = node.querySelector(tabContainerSelector);
                                if (tabContainer) {
                                    console.log(logPrefix, `Observer: Container de abas encontrado DENTRO de nó adicionado (${node.tagName}).`);
                                }
                            }

                            if (tabContainer) {
                                console.log(logPrefix, '>>> CONTAINER DE ABAS ENCONTRADO VIA OBSERVER! Chamando addProtocolLink...');
                                addProtocolLink(tabContainer, collectionKey, itemKey);
                                console.log(logPrefix, 'Desconectando observer após encontrar container.');
                                observer.disconnect();
                                currentObserver = null;
                                return;
                            }
                        }
                    }
                }
            }
        };

        currentObserver = new MutationObserver(callback);
        currentObserver.observe(targetNode, config);
        console.log(logPrefix, `Observer ATIVO no ${targetNode.tagName}. Aguardando container "${tabContainerSelector}"...`);

        const existingContainer = targetNode.querySelector(tabContainerSelector);
        if (existingContainer) {
            console.log(logPrefix, 'Container de abas encontrado na VERIFICAÇÃO INICIAL. Chamando addProtocolLink...');
            addProtocolLink(existingContainer, collectionKey, itemKey);
            console.log(logPrefix, 'Desconectando observer após sucesso inicial (container já existia).');
            if (currentObserver) { // Garante que só desconecta se foi criado
               currentObserver.disconnect();
               currentObserver = null;
            }
        } else {
            console.log(logPrefix, 'Container de abas não encontrado na verificação inicial.');
        }
    }

    /**
     * Função principal que roda em mudanças de URL ou carregamento inicial.
     */
    function checkUrlAndApply() {
        console.log(logPrefix, '>>> checkUrlAndApply EXECUTANDO para URL:', window.location.href);
        removeProtocolLink(); // Limpa o link anterior (usando o novo ID se já rodou antes)
        if (currentObserver) {
            console.log(logPrefix, "Desconectando observer existente em checkUrlAndApply.");
            currentObserver.disconnect();
            currentObserver = null;
        }

        const currentUrl = window.location.href;
        const parsed = parseZoteroUrl(currentUrl);

        if (parsed) {
            console.log(logPrefix, 'URL é de item. Iniciando observeForTabContainer...');
            observeForTabContainer(parsed.collectionKey, parsed.itemKey);
        } else {
            console.log(logPrefix, 'URL NÃO é de item. Limpeza feita.');
        }
        console.log(logPrefix,'<<< checkUrlAndApply CONCLUÍDA.');
    }

    // --- Monitorar mudanças na API de Histórico --- (sem alterações)
    const historyPushState = history.pushState;
    history.pushState = function() {
        historyPushState.apply(history, arguments);
        window.dispatchEvent(new CustomEvent('locationchange_pushstate'));
    };
    const historyReplaceState = history.replaceState;
    history.replaceState = function() {
        historyReplaceState.apply(history, arguments);
        window.dispatchEvent(new CustomEvent('locationchange_replacestate'));
    };
    window.addEventListener('locationchange_pushstate', checkUrlAndApply);
    window.addEventListener('locationchange_replacestate', checkUrlAndApply);
    window.addEventListener('popstate', checkUrlAndApply);

    // --- Verificação inicial --- (sem alterações)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
             console.log(logPrefix, 'DOM carregado, executando checkUrlAndApply inicial.');
             checkUrlAndApply();
        });
    } else {
         console.log(logPrefix, 'DOM já carregado, executando checkUrlAndApply inicial.');
        checkUrlAndApply();
    }

     // *** MUDANÇA 8: Mensagem de log final atualizada ***
    console.log(logPrefix, `<<<<< Script (v${GM_info.script.version} - Abrir no Desktop) carregado e pronto >>>>>`);

})();
