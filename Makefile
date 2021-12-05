# =============================================================================
# file: Makefile
# =============================================================================

NAME 	:= $(shell grep '^X-KDE-PluginInfo-Name=' metadata.desktop |cut -d'=' -f2)
SCRIPT 	:= $(shell realpath contents/$$(grep '^X-Plasma-MainScript=' metadata.desktop |cut -d'=' -f2))
VERSION	:= $(shell grep '^X-KDE-PluginInfo-Version=' metadata.desktop |cut -d'=' -f2)

# =============================================================================
# Script lifecycle
#
# install		Install script
# update		Update installed script
# remove		Remove installed script
# =============================================================================
.PHONY: install update remove

install:
	kpackagetool5 --type=KWin/Script -i .
	mkdir -p ~/.local/share/kservices5
	[ -f ~/.local/share/kservices5/$(NAME).desktop ] || ln -s ~/.local/share/kwin/scripts/$(NAME)/metadata.desktop ~/.local/share/kservices5/$(NAME).desktop 

update:
	kpackagetool5 --type=KWin/Script -u .
	mkdir -p ~/.local/share/kservices5
	[ -f ~/.local/share/kservices5/$(NAME).desktop ] || ln -s ~/.local/share/kwin/scripts/$(NAME)/metadata.desktop ~/.local/share/kservices5/$(NAME).desktop 
	
remove:
	kpackagetool5 --type=KWin/Script -r "$(NAME)"
	rm -v ~/.local/share/kservices5/$(NAME).desktop

package:
	zip -r "$(NAME)-$(VERSION).kwinscript" contents metadata.desktop

# =============================================================================
# Development niceties
#
# enable		Enable installed script
# disable		Disable installed script
# reload		(Re-)enable installed script
# =============================================================================
.PHONY: enable disable reload

enable:
	kwriteconfig5 --file kwinrc --group Plugins --key $(NAME)Enabled true
	qdbus org.kde.KWin /KWin reconfigure
	
disable:
	kwriteconfig5 --file kwinrc --group Plugins --key $(NAME)Enabled false
	qdbus org.kde.KWin /KWin reconfigure

reload: 
	$(MAKE) disable
	sleep 1
	$(MAKE) enable

# =============================================================================
# Development helpers
#
# console		open interactive scripting console
# run			Run main script file
# =============================================================================
.PHONY: console run 

console:
	dbus-send  --print-reply=literal --session --dest=org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.showInteractiveKWinConsole

run:
	dbus-send --print-reply --dest=org.kde.KWin /$$(dbus-send --print-reply --dest=org.kde.KWin /Scripting org.kde.kwin.Scripting.loadScript string:"$(SCRIPT)" | awk 'END {print $$2}')  org.kde.kwin.Scripting.run 

