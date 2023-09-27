import { useContext, useState } from "react";
import { ModalContext } from "../context/modal.context";
import { Store } from "../context/store.context";
import { NotificationContext } from "../context/notification.context";
import Button from "./Button.component";
import axios from "axios";
import "../styles/Modal.scss";

const Modal = () => {
  const { open, setOpen } = useContext(ModalContext);
  const { state, dispatch, setPostRequest } = useContext(Store);
  const { notification } = useContext(NotificationContext);
  const { username } = state;
  const [text, setText] = useState("");
  const [games, setGames] = useState([]);
  const [results, setResults] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);

  const onSearchHandler = async (event) => {
    event?.preventDefault();

    let { data } = await axios.get(`/search-games?term=${text}`);
    setResults(data);
    setIsFiltered(false);
  };

  const addGameHandler = (name, image) => {
    setGames([
      ...games,
      {
        name: name,
        image: image,
      },
    ]);
  };

  const removeGameHandler = (name, image) => {
    setGames(
      games.filter((game) => game.name !== name && game.image !== image)
    );
  };
  const gameAdded = (name) => {
    return games.some((game) => game.name === name);
  };

  const onSubmitHandler = async () => {
    let userInput;
    try {
      if (!username) {
        userInput = prompt("Enter your twitch username: ");
        localStorage.setItem("username-serenuy-games-ttv", userInput);
        dispatch({
          type: "username",
          payload: userInput,
        });
      }

      await axios.post("/add-suggested-game", {
        games,
        username: username ?? userInput,
      });

      notification(
        `${games.map(({ name }) =>
          JSON.stringify(name)
        )} added to suggested list successfully!`
      );
      setText("");
      setGames([]);
      setResults();
      setOpen(false);
      setPostRequest(true);
    } catch (error) {
      notification(error["response"]["data"]["message"]);
    }
  };

  const currentGamesHandler = () => {
    if (results === games) {
      onSearchHandler();
    }

    setResults(games);
    setIsFiltered(true);
    return;
  };

  return (
    open && (
      <div id="modal-container">
        <div className="submit-modal">
          <h2 className="modal-header">Suggest a game</h2>
          <div className="modal-body">
            <div>
              <form className="search-wrapper" onSubmit={onSearchHandler}>
                <input
                  className="search-field"
                  type="text"
                  placeholder="Search a game..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
                <Button variant="modalInput" type="submit">
                  Search
                </Button>
              </form>
              <div>
                <Button
                  className={results === games && "selected"}
                  variant="modalInput"
                  id="filter-games-btn"
                  type="button"
                  onClick={currentGamesHandler}
                >
                  Selected Games
                </Button>
              </div>
            </div>
            <div className="modal-listed-games">
              <div id="modal-results">
                {results?.map(({ name, image }, i) => (
                  <div
                    className="modal-results-item"
                    key={`${name}-game-results-${i}`}
                  >
                    {/* <!-- Column --> */}
                    <div className="modal-results-image">
                      <img
                        src={image}
                        alt={`${name}-game-cover`}
                        height="100%"
                        width="100%"
                      />
                    </div>
                    {/* <!-- Column --> */}
                    <div>
                      <div className="modal-results-title">{name}</div>
                      <Button
                        hidden={gameAdded(name)}
                        variant="modalAdd"
                        onClick={() => addGameHandler(name, image)}
                      >
                        Add
                      </Button>
                      <Button
                        className="selected"
                        hidden={!gameAdded(name)}
                        variant="modalAdd"
                        onClick={() => removeGameHandler(name, image)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {isFiltered && !games.length ? (
                  <div>
                    No games selected. Search for games to add before
                    submitting.
                  </div>
                ) : (
                  !results.length && <div>Start searching for games!</div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button
              variant="modalToggle"
              disabled={!games.length}
              onClick={() => onSubmitHandler()}
            >
              Submit Game Suggestion
            </Button>
            <Button variant="modalToggle" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  );
};

export default Modal;
