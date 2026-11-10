/* Shared film player UI. The deck lifecycle pauses/reset videos when leaving. */
(() => {
  for(const slide of document.querySelectorAll('.reveal .slides section.audience-film')){
  const video=slide.querySelector('video'), intro=slide.querySelector('.video-intro');
  const play=slide.querySelector('[data-play-film]'), status=slide.querySelector('.video-status');
  play.addEventListener('click',async()=>{
    status.textContent='Loading video…';
    try { await video.play(); status.textContent=''; }
    catch { status.textContent='Playback did not start. Try Play again, or skip the video.'; }
  });
  slide.querySelector('[data-skip-film]').addEventListener('click',()=>Reveal.right());
  video.addEventListener('play',()=>{
    intro.hidden=true;
    if(intro.contains(document.activeElement))video.focus();
    // Ensure native controls cannot overlap the separate music track.
    document.getElementById('song-audio')?.pause();
    document.querySelectorAll('video[data-film]').forEach(other=>{if(other!==video)other.pause();});
  });
  video.addEventListener('ended',()=>{
    intro.hidden=false;play.innerHTML='<span aria-hidden="true">▶</span> Watch again';status.textContent='Video finished. Replay it or continue to the next slide.';
  });
  video.addEventListener('error',()=>{intro.hidden=false;play.disabled=true;status.textContent='';});
  Reveal.on('slidechanged',e=>{
    if(e.previousSlide===slide||e.currentSlide===slide){video.pause();intro.hidden=false;status.textContent='';}
  });
  Reveal.on('overviewhidden',()=>{if(Reveal.getCurrentSlide()===slide)intro.hidden=false;});
  }
  // Preserve old full-film links while removing the former vertical alternative.
  if(location.hash==='#/slide-17d-full'){
    const slide=document.getElementById('slide-17d');
    const redirect=()=>{const i=Reveal.getIndices(slide);Reveal.slide(i.h,i.v);};
    if(Reveal.isReady())redirect();else Reveal.on('ready',redirect);
  }
})();
