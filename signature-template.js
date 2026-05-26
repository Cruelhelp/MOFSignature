(function () {
  var form = document.getElementById('signatureForm');
  var copyButton = document.getElementById('copySignatureButton');
  var logoImage = document.getElementById('logoImg');
  var embeddedLogoSrc = window.EMBEDDED_LOGO_SRC || logoImage.src;
  var mapping = {
    name: 'nameText',
    position: 'positionText',
    organization: 'organizationText',
    ministry: 'ministryText',
    division: 'divisionText',
    phone: 'phoneText',
    email: 'emailText',
    address: 'addressText',
    logoPath: 'logoImg'
  };

  logoImage.src = embeddedLogoSrc;

  form.addEventListener('input', function (event) {
    var target = event.target;
    var id = mapping[target.name];
    var output;
    var address;
    var addressNode;
    var parts;

    if (!id) return;

    if (target.name === 'logoPath') {
      logoImage.src = embeddedLogoSrc;
      return;
    }

    if (target.name === 'address') {
      address = target.value || '-';
      addressNode = document.getElementById(id);
      parts = address.split(/,\s+(?=Kingston)/i);
      addressNode.textContent = parts[0] || '-';

      if (parts[1]) {
        addressNode.appendChild(document.createElement('br'));
        addressNode.appendChild(document.createTextNode(parts[1]));
      }

      return;
    }

    output = document.getElementById(id);
    output.textContent = target.value || '-';
  });

  function fallbackCopyHtml(html) {
    var container = document.createElement('div');
    var range = document.createRange();
    var selection = window.getSelection();
    var copied;

    container.contentEditable = 'true';
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = html;
    document.body.appendChild(container);

    range.selectNodeContents(container);
    selection.removeAllRanges();
    selection.addRange(range);
    copied = document.execCommand('copy');
    selection.removeAllRanges();
    container.remove();

    return copied;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function px(value) {
    return Math.max(1, Math.round(value));
  }

  function getText(id) {
    return document.getElementById(id).innerText.replace(/\s+/g, ' ').trim();
  }

  function getCopiedPositionText() {
    return getText('positionText').replace(/\s*\(CPAD\)\s*/i, '').trim();
  }

  function getAddressLines() {
    var address = document.getElementById('addressText').innerText.trim();
    var lines = address.split(/\n+/);

    if (lines.length > 1) {
      return lines;
    }

    return address.split(/,\s+(?=Kingston)/i);
  }

  function imageToDataUrl(image) {
    return new Promise(function (resolve) {
      var canvas;
      var context;

      if (!image || !image.complete || !image.naturalWidth) {
        resolve(image ? image.src : '');
        return;
      }

      try {
        canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        resolve(image.src);
      }
    });
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = reject;
      image.src = src;
    });
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve(blob);
      }, 'image/png');
    });
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var testLine;
    var i;

    for (i = 0; i < words.length; i += 1) {
      testLine = line ? line + ' ' + words[i] : words[i];
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line, x, y);
        line = words[i];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      context.fillText(line, x, y);
    }
  }

  function drawCenteredFitText(context, text, centerX, y, maxWidth, fontWeight, fontSize, fontFamily, minSize) {
    var size = fontSize;

    do {
      context.font = fontWeight + ' ' + size + 'px ' + fontFamily;
      size -= 1;
    } while (context.measureText(text).width > maxWidth && size >= minSize);

    context.fillText(text, centerX, y);
  }

  function drawEmailIcon(context, x, y, size) {
    context.fillStyle = '#001670';
    context.beginPath();
    context.arc(x + (size / 2), y + (size / 2), size / 2, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#ffffff';
    context.lineWidth = Math.max(3, size * 0.055);
    context.lineJoin = 'round';
    context.strokeRect(x + (size * 0.23), y + (size * 0.31), size * 0.54, size * 0.38);
    context.beginPath();
    context.moveTo(x + (size * 0.24), y + (size * 0.33));
    context.lineTo(x + (size * 0.5), y + (size * 0.54));
    context.lineTo(x + (size * 0.76), y + (size * 0.33));
    context.moveTo(x + (size * 0.24), y + (size * 0.68));
    context.lineTo(x + (size * 0.43), y + (size * 0.51));
    context.moveTo(x + (size * 0.76), y + (size * 0.68));
    context.lineTo(x + (size * 0.57), y + (size * 0.51));
    context.stroke();
  }

  function drawLocationIcon(context, x, y, size) {
    var cx = x + (size / 2);
    var cy = y + (size * 0.42);

    context.fillStyle = '#001670';
    context.beginPath();
    context.arc(cx, cy, size * 0.36, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(cx - (size * 0.25), cy + (size * 0.2));
    context.lineTo(cx, y + size);
    context.lineTo(cx + (size * 0.25), cy + (size * 0.2));
    context.closePath();
    context.fill();
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
    context.fill();
  }

  function drawRoundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  function drawPhoneIcon(context, x, y, size) {
    context.strokeStyle = '#f0b800';
    context.lineWidth = Math.max(8, size * 0.2);
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x + (size * 0.28), y + (size * 0.22));
    context.bezierCurveTo(x + (size * 0.16), y + (size * 0.36), x + (size * 0.27), y + (size * 0.67), x + (size * 0.56), y + (size * 0.78));
    context.bezierCurveTo(x + (size * 0.67), y + (size * 0.82), x + (size * 0.79), y + (size * 0.77), x + (size * 0.82), y + (size * 0.66));
    context.stroke();

    context.fillStyle = '#f0b800';
    drawRoundedRect(context, x + (size * 0.2), y + (size * 0.13), size * 0.23, size * 0.18, size * 0.05);
    context.fill();
    drawRoundedRect(context, x + (size * 0.63), y + (size * 0.66), size * 0.24, size * 0.18, size * 0.05);
    context.fill();
  }

  function createSignaturePngBlob() {
    var width = 1740;
    var height = 729;
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var navy = '#001670';
    var gold = '#f0b800';
    var addressLines = getAddressLines();
    var logoSrc = embeddedLogoSrc;
    var leftCenter = 375;
    var leftBlockWidth = 560;
    var leftBlockX = leftCenter - (leftBlockWidth / 2);
    var logoWidth = 700;
    var logoHeight = 308;
    var logoX = leftCenter - (logoWidth / 2);

    canvas.width = width;
    canvas.height = height;

    return loadImage(logoSrc).then(function (logo) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);

      context.drawImage(logo, logoX, 58, logoWidth, logoHeight);

      context.fillStyle = navy;
      context.textAlign = 'center';
      context.textBaseline = 'alphabetic';
      drawCenteredFitText(context, getText('ministryText'), leftCenter, 420, leftBlockWidth, '900', 27, 'Arial, Helvetica, sans-serif', 22);

      context.fillRect(leftBlockX, 442, leftBlockWidth, 4);

      context.font = '900 50px Arial, Helvetica, sans-serif';
      context.letterSpacing = '2px';
      context.fillText(getText('divisionText'), leftCenter, 516);
      context.letterSpacing = '0px';

      context.fillRect(815, 0, 8, 729);

      context.textAlign = 'left';
      context.font = '700 64px Georgia, Times New Roman, serif';
      context.fillText(getText('nameText'), 910, 94);
      context.fillRect(910, 129, 660, 4);

      context.font = '500 33px Arial, Helvetica, sans-serif';
      drawWrappedText(context, getCopiedPositionText(), 910, 190, 710, 38);
      context.fillText(getText('organizationText'), 910, 235);

      context.font = '500 31px Arial, Helvetica, sans-serif';
      drawPhoneIcon(context, 902, 304, 60);
      context.fillStyle = navy;
      context.fillText(getText('phoneText'), 982, 347);

      drawEmailIcon(context, 902, 386, 60);
      context.fillStyle = navy;
      context.fillText(getText('emailText'), 982, 431);

      drawLocationIcon(context, 900, 466, 66);
      context.fillStyle = navy;
      context.fillText(addressLines[0] || '', 982, 512);
      if (addressLines[1]) {
        context.fillText(addressLines[1], 982, 555);
      }

      return canvasToBlob(canvas);
    });
  }

  function buildOutlookSignatureHtml(logoSrc) {
    var signature = document.querySelector('.signature-card');
    var rect = signature.getBoundingClientRect();
    var width = px(rect.width || 930);
    var height = px(width * 845 / 1862);
    var padX = px(width * 0.035);
    var padTop = px(width * 0.027);
    var padBottom = px(width * 0.034);
    var innerWidth = width - (padX * 2);
    var innerHeight = height - padTop - padBottom;
    var leftWidth = px(innerWidth * 0.484);
    var dividerWidth = Math.max(3, px(innerWidth * 0.0045));
    var gapWidth = px(innerWidth * 0.0325);
    var rightWidth = innerWidth - leftWidth - dividerWidth - (gapWidth * 2);
    var logoWidth = px(leftWidth * 0.92);
    var navy = '#001670';
    var gold = '#f0b800';
    var nameSize = px(width * 0.0375);
    var labelSize = px(width * 0.0145);
    var divisionSize = px(width * 0.0235);
    var textSize = px(width * 0.0185);
    var iconSize = px(width * 0.0315);
    var ruleHeight = Math.max(2, px(width * 0.0022));
    var name = escapeHtml(getText('nameText'));
    var position = escapeHtml(getText('positionText'));
    var organization = escapeHtml(getText('organizationText'));
    var ministry = escapeHtml(getText('ministryText'));
    var division = escapeHtml(getText('divisionText'));
    var phone = escapeHtml(getText('phoneText'));
    var email = escapeHtml(getText('emailText'));
    var addressLines = getAddressLines();
    var addressHtml = escapeHtml(addressLines[0] || '');
    var phoneIcon = '<span style="font-family:Arial,sans-serif;color:' + gold + ';font-size:' + iconSize + 'px;line-height:' + iconSize + 'px;font-weight:bold;">&#9742;</span>';
    var emailIcon = '<span style="display:inline-block;width:' + iconSize + 'px;height:' + iconSize + 'px;line-height:' + iconSize + 'px;text-align:center;background:' + navy + ';color:#ffffff;border-radius:50%;font-family:Arial,sans-serif;font-size:' + px(iconSize * 0.55) + 'px;">&#9993;</span>';
    var locationIcon = '<span style="display:inline-block;width:' + iconSize + 'px;height:' + iconSize + 'px;line-height:' + iconSize + 'px;text-align:center;background:' + navy + ';color:#ffffff;border-radius:50%;font-family:Arial,sans-serif;font-size:' + px(iconSize * 0.55) + 'px;">&#9679;</span>';

    if (addressLines[1]) {
      addressHtml += '<br>' + escapeHtml(addressLines[1]);
    }

    return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ffffff;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="' + width + '" style="width:' + width + 'px;height:' + height + 'px;background:#ffffff;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">' +
      '<tr><td style="padding:' + padTop + 'px ' + padX + 'px ' + padBottom + 'px ' + padX + 'px;background:#ffffff;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="' + innerWidth + '" height="' + innerHeight + '" style="width:' + innerWidth + 'px;height:' + innerHeight + 'px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">' +
      '<tr>' +
      '<td width="' + leftWidth + '" valign="top" style="width:' + leftWidth + 'px;text-align:center;vertical-align:top;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="' + leftWidth + '" height="' + innerHeight + '" style="width:' + leftWidth + 'px;height:' + innerHeight + 'px;border-collapse:collapse;">' +
      '<tr><td height="' + px(innerHeight * 0.43) + '" valign="bottom" style="height:' + px(innerHeight * 0.43) + 'px;text-align:center;vertical-align:bottom;">' +
      '<img src="' + logoSrc + '" width="' + logoWidth + '" style="display:block;width:' + logoWidth + 'px;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" alt="MOFPS logo">' +
      '</td></tr>' +
      '<tr><td style="padding-top:' + px(width * 0.0145) + 'px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:' + labelSize + 'px;line-height:' + px(labelSize * 1.08) + 'px;font-weight:900;color:' + navy + ';text-transform:uppercase;white-space:nowrap;">' + ministry + '</td></tr>' +
      '<tr><td height="' + px(width * 0.0145) + '" style="height:' + px(width * 0.0145) + 'px;border-bottom:' + ruleHeight + 'px solid ' + navy + ';font-size:0;line-height:0;">&nbsp;</td></tr>' +
      '<tr><td style="padding-top:' + px(width * 0.0145) + 'px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:' + divisionSize + 'px;line-height:' + divisionSize + 'px;font-weight:900;letter-spacing:1px;color:' + navy + ';text-transform:uppercase;white-space:nowrap;">' + division + '</td></tr>' +
      '<tr><td>&nbsp;</td></tr>' +
      '</table>' +
      '</td>' +
      '<td width="' + gapWidth + '" style="width:' + gapWidth + 'px;font-size:0;line-height:0;">&nbsp;</td>' +
      '<td width="' + dividerWidth + '" style="width:' + dividerWidth + 'px;background:' + navy + ';font-size:0;line-height:0;">&nbsp;</td>' +
      '<td width="' + gapWidth + '" style="width:' + gapWidth + 'px;font-size:0;line-height:0;">&nbsp;</td>' +
      '<td width="' + rightWidth + '" valign="top" style="width:' + rightWidth + 'px;vertical-align:top;padding-top:' + px(width * 0.0215) + 'px;">' +
      '<div style="font-family:Georgia,Times New Roman,serif;font-size:' + nameSize + 'px;line-height:' + nameSize + 'px;font-weight:700;color:' + navy + ';white-space:nowrap;border-bottom:' + ruleHeight + 'px solid ' + navy + ';padding-bottom:' + px(width * 0.0155) + 'px;">' + name + '</div>' +
      '<div style="padding-top:' + px(width * 0.0155) + 'px;font-family:Arial,Helvetica,sans-serif;font-size:' + textSize + 'px;line-height:' + px(textSize * 1.12) + 'px;font-weight:500;color:' + navy + ';white-space:nowrap;">' + position + '</div>' +
      '<div style="padding-top:' + px(width * 0.0125) + 'px;font-family:Arial,Helvetica,sans-serif;font-size:' + textSize + 'px;line-height:' + px(textSize * 1.12) + 'px;font-weight:500;color:' + navy + ';white-space:nowrap;">' + organization + '</div>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:' + px(width * 0.0345) + 'px;border-collapse:collapse;">' +
      '<tr><td width="' + iconSize + '" style="width:' + iconSize + 'px;vertical-align:middle;text-align:center;">' + phoneIcon + '</td><td style="padding-left:' + px(width * 0.016) + 'px;font-family:Arial,Helvetica,sans-serif;font-size:' + textSize + 'px;line-height:' + px(textSize * 1.16) + 'px;font-weight:500;color:' + navy + ';white-space:nowrap;">' + phone + '</td></tr>' +
      '<tr><td colspan="2" height="' + px(width * 0.0245) + '" style="height:' + px(width * 0.0245) + 'px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
      '<tr><td width="' + iconSize + '" style="width:' + iconSize + 'px;vertical-align:middle;text-align:center;">' + emailIcon + '</td><td style="padding-left:' + px(width * 0.016) + 'px;font-family:Arial,Helvetica,sans-serif;font-size:' + textSize + 'px;line-height:' + px(textSize * 1.16) + 'px;font-weight:500;color:' + navy + ';white-space:nowrap;">' + email + '</td></tr>' +
      '<tr><td colspan="2" height="' + px(width * 0.0245) + '" style="height:' + px(width * 0.0245) + 'px;font-size:0;line-height:0;">&nbsp;</td></tr>' +
      '<tr><td width="' + iconSize + '" style="width:' + iconSize + 'px;vertical-align:top;text-align:center;">' + locationIcon + '</td><td style="padding-left:' + px(width * 0.016) + 'px;font-family:Arial,Helvetica,sans-serif;font-size:' + textSize + 'px;line-height:' + px(textSize * 1.16) + 'px;font-weight:500;color:' + navy + ';white-space:nowrap;">' + addressHtml + '</td></tr>' +
      '</table>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</td></tr>' +
      '</table>' +
      '</body></html>';
  }

  function createSignatureHtml() {
    return imageToDataUrl(logoImage).then(function (logoSrc) {
      return buildOutlookSignatureHtml(logoSrc || embeddedLogoSrc);
    });
  }

  copyButton.addEventListener('click', function () {
    var text = document.querySelector('.signature-card').innerText;
    copyButton.textContent = 'Copying...';

    if (navigator.clipboard && window.ClipboardItem) {
      createSignaturePngBlob().then(function (blob) {
        var imageItem = new ClipboardItem({ 'image/png': blob });

        return navigator.clipboard.write([imageItem]);
      }).then(function () {
        copyButton.textContent = 'Copied Image';
        window.setTimeout(function () {
          copyButton.textContent = 'Copy Signature';
        }, 1800);
      }).catch(function () {
        copyHtmlFallback(text);
      });
      return;
    }

    copyHtmlFallback(text);
  });

  function copyHtmlFallback(text) {
    createSignatureHtml().then(function (html) {
      var clipboardItem;

      if (navigator.clipboard && window.ClipboardItem) {
        clipboardItem = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        });

        navigator.clipboard.write([clipboardItem]).then(function () {
          copyButton.textContent = 'Copied';
        }).catch(function () {
          copyButton.textContent = fallbackCopyHtml(html) ? 'Copied' : 'Copy Failed';
        });
      } else {
        copyButton.textContent = fallbackCopyHtml(html) ? 'Copied' : 'Copy Failed';
      }

      window.setTimeout(function () {
        copyButton.textContent = 'Copy Signature';
      }, 1800);
    });
  }
}());
