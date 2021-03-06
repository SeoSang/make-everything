import { observable, action, computed, flow } from "mobx"
import { RootStore, useStore } from "."
import axios from "axios"
import { BACKEND_URL } from "../util/util"
import { ChatData, RoomData } from "../types/chat"
import { getErrorText } from "../util/getErrorText"

export const initialChatState = {
  room: {} as RoomData,
  rooms: [] as RoomData[],
  chats: [] as ChatData[],
  soketId: -1,
  loadRoomError: "" as any,
  loadRoomsError: "" as any,
  addRoomError: "" as any,
  createFormOpen: false,
  enterFormOpen: false,
}

class ChatStore {
  @observable room = initialChatState.room
  @observable rooms = initialChatState.rooms
  @observable chats = initialChatState.chats
  @observable soketId = initialChatState.soketId
  @observable loadRoomsError = initialChatState.loadRoomsError
  @observable loadRoomError = initialChatState.loadRoomError
  @observable addRoomError = initialChatState.addRoomError
  @observable enterFormOpen = initialChatState.enterFormOpen
  @observable createFormOpen = initialChatState.createFormOpen
  public root

  constructor(root: RootStore) {
    this.root = root
  }

  @action
  openCreateForm = () => {
    this.createFormOpen = true
  }
  @action
  openEnterForm = () => {
    this.enterFormOpen = true
  }
  @action
  closeCreateForm = () => {
    this.createFormOpen = false
  }
  @action
  closeEnterForm = () => {
    this.enterFormOpen = false
  }

  @action
  addRoomBySocket = (data: RoomData) => {
    this.rooms.push(data)
  }

  @action
  removeRoomBySocket = (data: RoomData) => {
    this.rooms = this.rooms.filter((room) => {
      return room.id !== data.id
    })
  }

  @action
  getChat = (data: ChatData) => {
    const result = {
      ...data,
      createAt: new Date(),
      gif: null,
    }
    this.chats.push(result)
  }

  @action
  isPasswordCorrect = flow(function* (password: string, roomId: number) {
    const data = {
      password,
      roomId,
    }
    try {
      const result = yield axios.post(
        `${BACKEND_URL}/api/chat/room/check`,
        data,
        {
          withCredentials: true,
        }
      )
      yield console.log("isPasswordCorrect result => ", result)
      return "성공"
    } catch (e) {
      if (e.response.status === 410) return "존재하지 않는 방입니다."
      if (e.response.status === 403) return "비밀번호가 틀립니다."
      return "서버오류"
    }
  })

  @action
  loadRoom = flow(function* (roomId: number, password: string) {
    console.log({ roomId })
    this.loadRoomError = ""
    try {
      const result = yield axios.get(
        `${BACKEND_URL}/api/chat/room/${roomId}/${password}`,
        {
          withCredentials: true,
        }
      )
      yield console.log("loadRoom result => ", result)
      this.room = result.data.room
      this.chats = result.data.chats
      return { status: 200, text: "방 로드 성공!" }
    } catch (e) {
      yield console.log(e.response)
      this.loadRoomError = e.response
      return {
        status: e.response.status,
        text: getErrorText(e.response.status),
      }
    }
  })

  @action
  loadRooms = flow(function* () {
    this.loadRoomsError = ""
    try {
      const result = yield axios.get(`${BACKEND_URL}/api/chat/room/all`, {
        withCredentials: true,
      })
      yield console.log("loadRooms result => ", result)
      this.rooms = result.data
    } catch (e) {
      yield console.log(e)
      this.loadRoomsError = e.response
    }
  })

  @action
  addRoom = flow(function* (title: string, max: number, password: string) {
    this.addRoomError = ""
    try {
      const data = {
        title,
        max,
        password,
      }
      const result = yield axios.post(`${BACKEND_URL}/api/chat/room`, data, {
        withCredentials: true,
      })
      yield console.log("addRoom result => ", result)
      return result
    } catch (e) {
      yield console.log(e.response)
      this.addRoomError = e.response
      return false
    }
  })

  @action
  sendChat = flow(function* (message: string) {
    axios.post(
      `${BACKEND_URL}/api/chat/${this.room.id}`,
      {
        chat: message,
      },
      { withCredentials: true }
    )
  })

  @computed get info() {
    return {}
  }
}

// export const useMeStore = () => {
//   const { meStore } = useStore()
//   return useObserver(() => {
//     meStore
//   })
// }

export default ChatStore
