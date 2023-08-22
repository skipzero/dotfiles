# $NVM_DIR should be "$HOME/.nvm" by default to avoid user-installed nodes destroyed every update
[ -z "$NVM_DIR" ] && export NVM_DIR="$HOME/.nvm"
\. /usr/local/Cellar/nvm/0.39.4/libexec/nvm.sh
# "nvm exec" and certain 3rd party scripts expect "nvm.sh" and "nvm-exec" to exist under $NVM_DIR
[ -e "$NVM_DIR" ] || mkdir -p "$NVM_DIR"
[ -e "$NVM_DIR/nvm.sh" ] || ln -s /usr/local/opt/nvm/libexec/nvm.sh "$NVM_DIR/nvm.sh"
[ -e "$NVM_DIR/nvm-exec" ] || ln -s /usr/local/opt/nvm/libexec/nvm-exec "$NVM_DIR/nvm-exec"
