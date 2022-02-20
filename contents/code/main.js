/* ============================================================================
 * Running configuration
 * ========================================================================= */
var enabledDisplays = [];
var mapperObject = {};

/* ============================================================================
 * Helper function. Is screen with (index) enabled for virtual desktops?
 * ========================================================================= */
function isDisplayEnabled(index) {
  return enabledDisplays.indexOf(mapperObject[index]) != -1 ? true : false;
}

/* ============================================================================
 * Handle pinning and unpinning of windows
 * ========================================================================= */
function handleWindow(client) {
  const thisClient = client || this;

  /* Skip these windows */
  if (thisClient.desktopWindow || thisClient.dock || (!thisClient.normalWindow && thisClient.skipTaskbar)) {
    return;
  }

  /* Was window previously pinned... */
  if (thisClient.desktop == -1) {

    /* ...and was moved to an screen with virtual desktops? */
    if (isDisplayEnabled(thisClient.screen)) {

      /* Then unpin it */
      thisClient.desktop = workspace.currentDesktop;
    }

  } else {

    /* Was window previously unpinned, and moved to a screen without virtual desktops? */
    if (!isDisplayEnabled(thisClient.screen)) {

      /* Then pin it */
      thisClient.desktop = -1;
    }
  }
}

/* ============================================================================
 * Rebuild mapper object for mapping screen index to display names.
 *
 * NOTE: We use an object rather than an array just in case the screen indices
 * should not be consecutive [0..screens-1].
 * 
 * This is some rather ugly parsing, but it does the job...
 * ========================================================================= */
function updateMapperObject() {
  mapperObject = {};

  /* Get info to parse */
  workspace.supportInformation().split('Screens\n')[1]
    .split('Screen ')

    .forEach(function (line) {
      const index = line.split(':\n')[0];

      /* This must be a screen */
      if (index == parseInt(index)) {
        var name = line.split('Name: ')[1];

        /* This is a screen with a name */
        if (name) {
          name = name.split('\n')[0];
          mapperObject[index] = name;
        }
      }
    });
};

/* ============================================================================
 * Kick the bucket!
 * ========================================================================= */
function main() {

  /* Handle configuration */
  enabledDisplays = readConfig('enabledDisplays', '').toString().split(',');
  options.configChanged.connect(function () {
    enabledDisplays = readConfig('enabledDisplays', '').toString().split(',');
  });


  /* Make sure we have a valid mapper object from the start */
  updateMapperObject();

  /* Update mapper object on changes in number of screens */
  workspace.numberScreensChanged.connect(updateMapperObject);

  /* Handle existing clients */
  workspace.clientList().forEach(function (client) {
    client.screenChanged.connect(client, handleWindow);
    handleWindow(client)
  });

  /* Handle new windows */
  workspace.clientAdded.connect(function (client) {
    client.screenChanged.connect(client, handleWindow);
    handleWindow(client)
  });
}

main();
