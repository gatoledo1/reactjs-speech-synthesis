# reactjs-speech-synthesis 🎧


https://reactjs-speech-synthesis.vercel.app/

## This feature solved bugs 🚀

This voice synthesizer has paragraph breaking in arrays, thus solving a problem found in Android, which does not allow speech of more than 4000 characters.

At each end of speech, the array index is updated, so the synthesizer only sees paragraph by paragraph.

The pause also follows the paragraph break, because in the synthesizer web API the pause doesn't work very well, after 4 seconds, the audio is canceled and returns to the beginning.

Another bug found on Android is that the language has a name with "_" (underscore), instead of "-" (hyphen), which causes a problem when picking up the voices.

https://user-images.githubusercontent.com/19327889/173367437-329461ac-8e2a-4271-9036-f76266d30eed.mp4

