const viewerOverlay = document.getElementById('viewerOverlay');
const viewerBody = document.getElementById('viewerBody');
const viewerTitle = document.getElementById('viewerTitle');
const viewerClose = document.getElementById('viewerClose');

if (viewerOverlay && viewerClose) {
    viewerClose.addEventListener('click', () => {
        viewerOverlay.classList.remove('active');
        viewerBody.innerHTML = ''; // Clear content when closing
    });

    viewerOverlay.addEventListener('click', (e) => {
        if (e.target === viewerOverlay) {
            viewerOverlay.classList.remove('active');
            viewerBody.innerHTML = '';
        }
    });
}

window.openFileViewer = function(url, fileName = 'Archivo') {
    if (!viewerOverlay || !viewerBody) return;

    viewerTitle.textContent = fileName;
    const extension = url.split('?')[0].split('.').pop().toLowerCase();

    if (extension === 'pdf') {
        viewerBody.innerHTML = `<iframe src="${url}" width="100%" height="80vh" style="border:none;"></iframe>`;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        viewerBody.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:80vh;">
                                    <img src="${url}" style="max-width:100%; max-height:100%; object-fit:contain;">
                                </div>`;
    } else {
        viewerBody.innerHTML = `<p style="text-align:center; padding:20px;">El tipo de archivo .${extension} no es compatible con el visor interno. <a href="${url}" target="_blank">Abrir en pestaña nueva</a></p>`;
    }

    viewerOverlay.classList.add('active');
};
