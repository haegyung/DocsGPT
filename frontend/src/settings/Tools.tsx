import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import userService from '../api/services/userService';
import CogwheelIcon from '../assets/cogwheel.svg';
import NoFilesIcon from '../assets/no-files.svg';
import NoFilesDarkIcon from '../assets/no-files-dark.svg';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import ToggleSwitch from '../components/ToggleSwitch';
import { useDarkTheme } from '../hooks';
import AddToolModal from '../modals/AddToolModal';
import { ActiveState } from '../models/misc';
import { selectToken } from '../preferences/preferenceSlice';
import ToolConfig from './ToolConfig';
import { APIToolType, UserToolType } from './types';

export default function Tools() {
  const { t } = useTranslation();
  const token = useSelector(selectToken);
  const [isDarkTheme] = useDarkTheme();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [addToolModalState, setAddToolModalState] =
    React.useState<ActiveState>('INACTIVE');
  const [userTools, setUserTools] = React.useState<UserToolType[]>([]);
  const [selectedTool, setSelectedTool] = React.useState<
    UserToolType | APIToolType | null
  >(null);
  const [loading, setLoading] = React.useState(false);

  const getUserTools = () => {
    setLoading(true);
    userService
      .getUserTools(token)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setUserTools(data.tools);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching tools:', error);
        setLoading(false);
      });
  };

  const updateToolStatus = (toolId: string, newStatus: boolean) => {
    userService
      .updateToolStatus({ id: toolId, status: newStatus }, token)
      .then(() => {
        setUserTools((prevTools) =>
          prevTools.map((tool) =>
            tool.id === toolId ? { ...tool, status: newStatus } : tool,
          ),
        );
      })
      .catch((error) => {
        console.error('Failed to update tool status:', error);
      });
  };

  const handleSettingsClick = (tool: UserToolType) => {
    setSelectedTool(tool);
  };

  const handleGoBack = () => {
    setSelectedTool(null);
    getUserTools();
  };

  const handleToolAdded = (toolId: string) => {
    userService
      .getUserTools(token)
      .then((res) => res.json())
      .then((data) => {
        const newTool = data.tools.find(
          (tool: UserToolType) => tool.id === toolId,
        );
        if (newTool) {
          setSelectedTool(newTool);
        } else {
          console.error('Newly added tool not found');
        }
      })
      .catch((error) => console.error('Error fetching tools:', error));
  };

  React.useEffect(() => {
    getUserTools();
  }, []);
  return (
    <div>
      {selectedTool ? (
        <ToolConfig
          tool={selectedTool}
          setTool={setSelectedTool}
          handleGoBack={handleGoBack}
        />
      ) : (
        <div className="mt-8">
          <div className="relative flex flex-col">
            <div className="my-3 flex items-center justify-between gap-1">
              <div className="p-1">
                <label htmlFor="tool-search-input" className="sr-only">
                  {t('settings.tools.searchPlaceholder')}
                </label>
                <Input
                  maxLength={256}
                  placeholder={t('settings.tools.searchPlaceholder')}
                  name="Document-search-input"
                  type="text"
                  id="tool-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderVariant="thin"
                />
              </div>
              <button
                className="flex h-[30px] w-[108px] items-center justify-center rounded-full bg-purple-30 text-sm text-white hover:bg-violets-are-blue"
                onClick={() => {
                  setAddToolModalState('ACTIVE');
                }}
              >
                {t('settings.tools.addTool')}
              </button>
            </div>
            <div className="mb-8 mt-5 border-b border-light-silver dark:border-dim-gray" />
            {loading ? (
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                <div className="col-span-2 mt-24 flex h-32 items-center justify-center lg:col-span-3">
                  <Spinner />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                {userTools.length === 0 ? (
                  <div className="flex w-full flex-col items-center justify-center py-12">
                    <img
                      src={isDarkTheme ? NoFilesDarkIcon : NoFilesIcon}
                      alt="No tools found"
                      className="mx-auto mb-6 h-32 w-32"
                    />
                    <p className="text-center text-lg text-gray-500 dark:text-gray-400">
                      {t('settings.tools.noToolsFound')}
                    </p>
                  </div>
                ) : (
                  userTools
                    .filter((tool) =>
                      tool.displayName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                    )
                    .map((tool, index) => (
                      <div
                        key={index}
                        className="relative flex h-52 w-[300px] flex-col justify-between rounded-2xl border border-light-gainsboro bg-white-3000 p-6 dark:border-arsenic dark:bg-transparent"
                      >
                        <button
                          onClick={() => handleSettingsClick(tool)}
                          aria-label={t('settings.tools.configureToolAria', {
                            toolName: tool.displayName,
                          })}
                          className="absolute right-4 top-4"
                        >
                          <img
                            src={CogwheelIcon}
                            alt={t('settings.tools.settingsIconAlt')}
                            className="h-[19px] w-[19px]"
                          />
                        </button>
                        <div className="w-full">
                          <div className="flex w-full items-center px-1">
                            <img
                              src={`/toolIcons/tool_${tool.name}.svg`}
                              alt={`${tool.displayName} icon`}
                              className="h-6 w-6"
                            />
                          </div>
                          <div className="mt-[9px]">
                            <p
                              title={tool.displayName}
                              className="truncate px-1 text-[13px] font-semibold capitalize leading-relaxed text-raisin-black-light dark:text-bright-gray"
                            >
                              {tool.displayName}
                            </p>
                            <p className="mt-1 h-24 overflow-auto px-1 text-[12px] leading-relaxed text-old-silver dark:text-sonic-silver-light">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <ToggleSwitch
                            checked={tool.status}
                            onChange={(checked) =>
                              updateToolStatus(tool.id, checked)
                            }
                            size="small"
                            id={`toolToggle-${index}`}
                            ariaLabel={t('settings.tools.toggleToolAria', {
                              toolName: tool.displayName,
                            })}
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
          <AddToolModal
            message={t('settings.tools.selectToolSetup')}
            modalState={addToolModalState}
            setModalState={setAddToolModalState}
            getUserTools={getUserTools}
            onToolAdded={handleToolAdded}
          />
        </div>
      )}
    </div>
  );
}
