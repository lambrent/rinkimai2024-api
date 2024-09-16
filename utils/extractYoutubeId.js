exports.extractYoutubeID = (url) => {
  let id = '';
  const pattern = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(pattern);

  if (match && match[2].length === 11) {
    id = match[2];
  }

  return id;
}
