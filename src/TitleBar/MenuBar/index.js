import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MenuButton from './MenuButton';
import MenuList from './MenuList';
import { reduxSet, getProperty } from '../utils';
import ThemeContext from '../Theme';
import { buildMenu } from './utils';

const menuIcon = (
  <svg version="1.1" width="24px" height="24px" viewBox="0 0 32 32">
    <path d="M 4 7 L 4 9 L 28 9 L 28 7 Z M 4 15 L 4 17 L 28 17 L 28 15 Z M 4 23 L 4 25 L 28 25 L 28 23 Z "/>
  </svg>
);

const styles = {
  Wrapper: {
    display: 'flex',
    WebkitAppRegion: 'no-drag',
    maxWidth: 'calc(100% - 163px)'
  }
};

class MenuBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hovering: -1,
      focusing: 0,
      clicked: false,
      menu: buildMenu(props.menu)
    };

    this.onResize = this.onResize.bind(this);
    this.onMenuButtonMouseOver = this.onMenuButtonMouseOver.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
    this.setMenuRef = this.setMenuRef.bind(this);
    this.changeCheckState = this.changeCheckState.bind(this);
    this.generateHorizontalMenu = this.generateHorizontalMenu.bind(this);
    this.generateVerticalMenu = this.generateVerticalMenu.bind(this);
    this.changeEnabledState = this.changeEnabledState.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.menu !== this.state.menu) {
      this.setState({
        menu: buildMenu(nextProps.menu)
      });
    }
  }

  componentWillUnmount() {
    window.addEventListener('resize', this.onResize);
  }

  onResize() {

  }

  // if hovering over another button while menu is clicked; change focus
  onMenuButtonMouseOver(i) {
    if (this.state.clicked) {
      this.setState({
        focusing: i
      });
    }
  }

  // lock set to true to keep menu panes open
  onTouchStart(i) {
    if (i !== this.state.focusing && this.state.clicked) {
      this.lock = true;
    }
  }

  // if moving over a different menu button - select that menu button
  onMouseMove(i) {
    if (i === this.state.focusing) return;
    this.setState({
      focusing: i
    });
  }

  // when a menu button is clicked
  onMenuButtonClick(index) {
    if (this.lock) {
      this.lock = false;
      return;
    }
    this.setState({
      clicked: !(this.state.focusing === index && this.state.clicked),
      hovering: !(this.state.focusing === index && this.state.clicked) ? this.state.hovering : -1
    });
  }

  // we need the rect's bounds for the child menu pane
  setMenuRef(ref, i) {
    if (this.menuItems) {
      this.menuItems[i] = ref;
    } else {
      this.menuItems = { [i]: ref };
    }
  }

  // path: to current submenu
  // checked: new state
  changeCheckState(path, itemIndx, checked, isRadio = false) {
    if (!isRadio) {
      // change checked state
      this.setState(reduxSet(this.state, [...path, itemIndx, 'checked'], checked));
    } else {
      let newState = { ...this.state };
      getProperty(path, this.state).forEach((menuItem, indx) => {
        if (menuItem.type === 'radio') {
          newState = reduxSet(newState, [...path, indx, 'checked'], indx === itemIndx);
        }
      });
      this.setState(newState);
    }
  }

  findMenuItemPath = (menu, path, id) => {
    for (var i = 0; i < menu.length; i++) {
      if (menu[i].id && menu[i].id === id) {
        return { found: true, path: [...path, i] };
      } else if ((menu[i].type && menu[i].type.toLowerCase() === 'submenu') || (menu.submenu && Array.isArray(menu.submenu))) {
        return this.findMenuItemPath(menu, [...path, i, 'subemenu'], id);
      }
    }
    return { found: false };
  };

  changeEnabledStateById(id, enabled = true) {
    // get path to id
    let menuPath = ['menu'];
    for (var i = 0; i < this.state.menu.length; i++) {
      if (this.state.menu[i].id === id) {
        this.changeEnabledState([...menuPath, i], enabled);
        return true;
      } else if ((this.state.menu[i].type && this.state.menu[i].type.toLowerCase() === 'submenu') || (this.state.menu[i].submenu && Array.isArray(this.state.menu[i].submenu))) {
        let { found, path } = this.findMenuItemPath(this.state.menu[i].submenu, [...menuPath, i, 'submenu'], id);
        if (found) {
          this.changeEnabledState([...path], enabled);
          return true;
        }
      }
    }
    // there was no item to change
    return false;
  }

  changeEnabledState(path, enabled) {
    console.log(path, enabled);
    this.setState(reduxSet(this.state, [...path, 'enabled'], enabled), () => console.log(this.state.menu));
  }

  generateHorizontalMenu(menuObj = []) {
    return menuObj.map((menuItem, i) => {
      return (
        <MenuButton
          key={`${menuItem.label}`}
          onMouseEnter={() => {
            if (menuItem.enabled === false) return;
            this.setState({
              hovering: i
            });
          }}
          onMouseLeave={() => {
            if (menuItem.enabled === false) return;
            this.setState({
              hovering: -1
            });
          }}
          onMouseOver={() => {
            if (menuItem.enabled === false) return;
            this.onMenuButtonMouseOver(i);
          }}
          onMouseMove={() => {
            if (menuItem.enabled === false) return;
            this.onMouseMove(i);
          }}
          onTouchStart={() => {
            if (menuItem.enabled === false) return;
            this.onTouchStart(i);
          }}
          onClick={() => {
            if (menuItem.enabled === false) return;
            this.onMenuButtonClick(i);
          }}
          onFocus={() => {
            // idk - linting says it needs it? it has no purpose for me
          }}
          rectRef={(ref) => this.setMenuRef(ref, i)}
          hovering={i === this.state.hovering}
          open={this.state.clicked && i === this.state.focusing}
          closed={!this.state.clicked || i !== this.state.focusing}
          enabled={menuItem.enabled}
          label={menuItem.label}
        >
          {
            (this.state.clicked && i === this.state.focusing) &&
              <MenuList
                changeCheckState={this.changeCheckState}
                menu={this}
                rect={this.menuItems[i].getBoundingClientRect()}
                submenu={menuItem.submenu}
                mainIndex={i}
                path={['menu', i]}
              />
          }
        </MenuButton>
      );
    });
  }

  generateVerticalMenu(menuList = []) {
    return (
      <MenuButton
        onMouseEnter={() => {
          this.setState({
            hovering: 0,
          });
        }}
        onMouseLeave={() => {
          this.setState({
            hovering: -1,
          });
        }}
        onMouseOver={() => {
          this.onMenuButtonMouseOver(0);
        }}
        onMouseMove={() => {
          this.onMouseMove(0);
        }}
        onTouchStart={() => {
          this.onTouchStart(0);
        }}
        onClick={() => {
          this.onMenuButtonClick(0);
        }}
        onFocus={() => {
          // idk - linting says it needs it? it has no purpose for me
        }}
        rectRef={(ref) => this.setMenuRef(ref, 0)}
        hovering={this.state.hovering === 0}
        open={this.state.clicked && this.state.focusing === 0}
        closed={!this.state.clicked || this.state.focusing !== 0}
        label={menuIcon}
        enabled
      >
        {
          (this.state.clicked && this.state.focusing === 0) &&
            <MenuList
              changeCheckState={this.changeCheckState}
              rect={this.menuItems[0].getBoundingClientRect()}
              menu={this}
              submenu={menuList}
              path={['menu']}
              vertical
            />
        }
      </MenuButton>
    );
  }

  render() {
    let theme = this.context;
    let color = theme.menuItemTextColor || theme.barColor;
    return (
      <div style={{ ...styles.Wrapper, color }}>
        {theme.menuStyle === 'horizontal' ? this.generateHorizontalMenu(this.state.menu) : this.generateVerticalMenu(this.state.menu)}
      </div>
    );
  }
}

MenuBar.propTypes = {
  menu: PropTypes.array
};

MenuBar.defaultProps = {
  menu: []
};

MenuBar.contextType = ThemeContext;

export default MenuBar;
