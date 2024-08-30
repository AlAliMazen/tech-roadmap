import { createContext, useContext, useEffect, useMemo, useState } from "react";

import axios from "axios";
import { axiosRes } from "../api/axiosDefault";
import { axiosReq } from "../api/axiosDefault";
import { response } from "msw";
import { useHistory } from "react-router";

//the following two varibale, has to do with context variable
export const CurrentUserContext = createContext();
export const SetCurrentUserContext = createContext();

export const useCurrentUser = () => useContext(CurrentUserContext)
export const useSetCurrentUser = () => useContext(SetCurrentUserContext)

export const CurrentUserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // to get who and whether the user is looged in, we need to send
    const history = useHistory()

  // Network request
  const handleMount = async () => {
    try {
      const { data } = await axiosRes.get("dj-rest-auth/user/");
      setCurrentUser(data);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    handleMount();
  }, []);


  useMemo(()=>{
        axiosReq.interceptors.request.use(
            async (config) => {
                try{
                    await axios.post("/dj-rest-auth/tokem/refresh/")
                }catch(err){
                    setCurrentUser((prevCurrentUser) => {
                        if (prevCurrentUser) {
                            history.push("/signin")
                        }
                        return null;
                    });
                    return config;
                }
                return config;
            }, (err) => {
                return Promise.reject(err);
            }
        );
        // axiosRes for keep the user logged in for 24 hrs
        axiosRes.interceptors.response.use(
            (response) => response,
            async(err) => {
                if (err.response?.status === 401 ){
                    try{
                        await axios.post('/dj-rest-auth/refresh/')
                    }catch(err){
                        setCurrentUser(prevCurrentUser => {
                            if (prevCurrentUser){
                                history.push('/signin')
                            }
                            return null
                        })
                    }
                    return axios(err.config)
                }
                return Promise.reject(err)
            }
        )
  }, [history])

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <SetCurrentUserContext.Provider value={setCurrentUser}>
        {children}
      </SetCurrentUserContext.Provider>
    </CurrentUserContext.Provider>
  );
};
