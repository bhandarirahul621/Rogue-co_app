/* Rogue&Co accounts: email + password sign in / sign up with Supabase Auth.
   The URL and publishable key below are public by design (they identify the project, not grant admin access). */
(function(){
  const SUPABASE_URL = 'https://masrtghpydxbacufdswg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Xjl1QdhVqdp-PuMDF2MALQ_BjeeHvyd';
  const MIN_PASS = 8;

  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const dlg = $('#authDialog');
  if (!dlg) return;
  if (!window.supabase || !window.supabase.createClient) {
    // Library failed to load (offline, blocked): keep the buttons but explain instead of breaking.
    $$('[data-auth]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); alert('Accounts are unavailable right now. Please check your connection and try again.'); }));
    return;
  }
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const form = $('#authForm'), msg = $('#authMsg'), submit = $('#authSubmit');
  const nameIn = $('#authName'), emailIn = $('#authEmail'), passIn = $('#authPass');
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  /* ---------- Views ---------- */
  const VIEWS = {
    signin: { title: 'Welcome back', sub: 'Sign in to see your orders, saved sizes and drop alerts.', btn: 'Sign In', tabs: true,
              foot: 'New to Rogue&Co? <a href="#account" data-view="signup">Create an account</a>' },
    signup: { title: 'Join the Crew', sub: 'Free forever. Save your sizes, get drop alerts and check out faster.', btn: 'Create Account', tabs: true,
              foot: 'Already have an account? <a href="#account" data-view="signin">Sign in</a>' },
    forgot: { title: 'Reset your password', sub: "Enter your account email and we'll send you a link to choose a new password.", btn: 'Send Reset Link', tabs: false,
              foot: '<a href="#account" data-view="signin">Back to sign in</a>' },
    reset:  { title: 'Choose a new password', sub: 'Pick something you haven’t used here before.', btn: 'Save New Password', tabs: false, foot: '' }
  };
  let view = 'signin', currentUser = null;

  function setView(v){
    view = v; const cfg = VIEWS[v];
    $('#authTitle').textContent = cfg.title;
    $('#authSub').textContent = cfg.sub;
    submit.textContent = cfg.btn;
    $('#authTabs').hidden = !cfg.tabs;
    $$('#authTabs [role=tab]').forEach(t => t.setAttribute('aria-selected', t.dataset.view === v));
    $$('#authForm [data-for]').forEach(el => el.hidden = !el.dataset.for.split(' ').includes(v));
    $('#forgotLink').hidden = v !== 'signin';
    $('#passLabel').textContent = v === 'reset' ? 'New password' : 'Password';
    passIn.autocomplete = v === 'signin' ? 'current-password' : 'new-password';
    $('#authFoot').innerHTML = cfg.foot;
    say('');
    [nameIn, emailIn, passIn].forEach(i => { i.classList.remove('bad'); i.removeAttribute('aria-invalid'); });
  }

  function open(v){
    setView(v);
    if (!dlg.open) dlg.showModal();
    (v === 'signup' ? nameIn : v === 'reset' ? passIn : emailIn).focus();
  }
  function close(){ if (dlg.open) dlg.close(); }

  function say(text, ok){ msg.textContent = text; msg.classList.toggle('ok', !!ok); }
  function busy(on){ submit.disabled = on; submit.textContent = on ? 'Please wait…' : VIEWS[view].btn; }
  function bad(input, text){ input.classList.add('bad'); input.setAttribute('aria-invalid', 'true'); input.focus(); say(text); }

  /* Translate Supabase errors into plain language. */
  function friendly(err){
    const m = (err && err.message || '').toLowerCase();
    if (m.includes('invalid login credentials')) return 'That email and password don’t match. Check them or reset your password.';
    if (m.includes('email not confirmed')) return 'Please confirm your email first. We’ve sent a fresh link to your inbox.';
    if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Try signing in instead.';
    if (m.includes('rate limit') || m.includes('too many') || (err && err.status === 429)) return 'Too many attempts. Please wait a few minutes and try again.';
    if (m.includes('should be different')) return 'Your new password must be different from your old one.';
    if (m.includes('password')) return err.message;
    if (m.includes('fetch') || m.includes('network')) return 'Couldn’t reach the server. Check your connection and try again.';
    return err && err.message ? err.message : 'Something went wrong. Please try again.';
  }

  /* ---------- Submit ---------- */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = emailIn.value.trim(), password = passIn.value, name = nameIn.value.trim();
    if (view !== 'reset' && !emailOk(email)) return bad(emailIn, 'Enter an email like name@example.com.');
    if (view === 'signin' && !password) return bad(passIn, 'Enter your password.');
    if ((view === 'signup' || view === 'reset') && password.length < MIN_PASS) return bad(passIn, `Use at least ${MIN_PASS} characters for your password.`);

    busy(true); say('');
    [nameIn, emailIn, passIn].forEach(i => { i.classList.remove('bad'); i.removeAttribute('aria-invalid'); });
    try {
      if (view === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          if ((error.message || '').toLowerCase().includes('email not confirmed')) {
            await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: location.origin + '/' } });
          }
          throw error;
        }
        close();
      } else if (view === 'signup') {
        const { data, error } = await sb.auth.signUp({
          email, password,
          options: { data: { first_name: name }, emailRedirectTo: location.origin + '/' }
        });
        if (error) throw error;
        // With "Confirm email" on (Supabase's default) there is no session until the link is clicked.
        if (data.session) close();
        else {
          // Supabase returns a user with no identities when the email is already taken (to avoid leaking accounts).
          if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            say('An account with this email already exists. Try signing in instead.');
          } else {
            form.reset();
            say(`Almost there! We sent a confirmation link to ${email}. Click it to activate your account.`, true);
          }
        }
      } else if (view === 'forgot') {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/' });
        if (error) throw error;
        say(`If an account exists for ${email}, a reset link is on its way.`, true);
      } else if (view === 'reset') {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        form.reset();
        say('Password updated. You’re signed in.', true);
        setTimeout(close, 1500);
      }
    } catch (err) {
      say(friendly(err));
    } finally {
      busy(false);
    }
  });

  /* ---------- Opening, closing, switching ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-auth], #authDialog [data-view]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.view) return setView(a.dataset.view), (a.dataset.view === 'signup' ? nameIn : emailIn).focus();
    if (a.dataset.auth === 'signout') return sb.auth.signOut();
    if (currentUser) return; // already signed in: "Join Free" has nothing to do
    open(a.dataset.auth);
  });
  [nameIn, emailIn, passIn].forEach(i => i.addEventListener('input', () => { i.classList.remove('bad'); i.removeAttribute('aria-invalid'); }));
  $('#authClose').addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); }); // click on the dark backdrop

  /* ---------- Signed-in state in the nav ---------- */
  function render(session){
    const user = currentUser = session && session.user || null;
    const label = user ? ((user.user_metadata && user.user_metadata.first_name) || user.email) : '';
    $$('[data-auth="signin"], [data-auth="signup"]').forEach(el => {
      if (el.closest('.tier')) el.textContent = user ? 'You’re in the Crew' : 'Join Free';
      else el.hidden = !!user;
    });
    $$('[data-auth="signout"]').forEach(el => { if (!el.closest('.acct')) el.hidden = !user; });
    $('#acct').hidden = !user;
    $('#acctName').textContent = user ? 'Hi, ' + label : '';
    $('#drawerAcct').hidden = !user;
    $('#drawerAcct').textContent = user ? 'Signed in as ' + user.email : '';
  }

  sb.auth.onAuthStateChange((event, session) => {
    render(session);
    if (event === 'PASSWORD_RECOVERY') open('reset');           // arrived from a reset-password email
  });
  sb.auth.getSession().then(({ data }) => render(data.session));
})();
